import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { LimpiarBorrador } from "@/componentes/GuardaBorrador";
import { exigir } from "@/lib/sesion";
import { horaLocal, minutosZona } from "@/lib/zona";

export const metadata: Metadata = { title: "Compras", robots: { index: false } };

const PAGO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  credito: "A crédito",
};

/** Las compras a proveedores: lo que entró a la bodega y a qué costo. */
export default async function Compras({
  searchParams,
}: {
  searchParams: Promise<{ registrada?: string }>;
}) {
  await exigir("compras");
  const { registrada } = await searchParams;
  const db = await baseDeDatos();
  const minutos = await minutosZona();

  const compras = db
    ? (
        await db
          .prepare(
            `SELECT c.id, c.fecha, c.total, c.factura, c.metodo_pago, c.nota, p.nombre AS proveedor,
                    u.nombre AS usuario
             FROM compra c
             LEFT JOIN proveedor p ON p.id = c.proveedor_id
             LEFT JOIN usuario u ON u.id = c.usuario_id
             ORDER BY c.id DESC LIMIT 100`,
          )
          .all<{
            id: number;
            fecha: string;
            total: number;
            factura: string | null;
            metodo_pago: string | null;
            nota: string | null;
            proveedor: string | null;
            usuario: string | null;
          }>()
      ).results
    : [];

  const ids = compras.map((c) => c.id);
  const items = db && ids.length
    ? (
        await db
          .prepare(
            `SELECT compra_id, descripcion, cantidad, costo_unit FROM compra_item
             WHERE compra_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
          )
          .bind(...ids)
          .all<{ compra_id: number; descripcion: string; cantidad: number; costo_unit: number }>()
      ).results
    : [];

  const delMes = db
    ? await db
        .prepare(
          `SELECT COALESCE(SUM(total), 0) AS total FROM compra
           WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')`,
        )
        .first<{ total: number }>()
    : null;

  return (
    <div className="pb-24">
      {registrada && <LimpiarBorrador claves={["compra-nueva"]} />}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/explorar"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Compras a proveedores</h1>
      </div>

      {registrada && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          Compra registrada: el stock subió y los costos quedaron al día.
        </p>
      )}

      <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-gris">Comprado este mes</p>
        <p className="mt-0.5 text-xl font-black tracking-tight">{formatearPrecio(delMes?.total ?? 0)}</p>
      </div>

      {compras.length === 0 ? (
        <p className="rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          Todavía no hay compras. Cuando te llegue mercancía, regístrala aquí y el stock sube solo.
        </p>
      ) : (
        <ul className="space-y-2">
          {compras.map((compra) => (
            <li key={compra.id} className="rounded-2xl bg-white shadow-sm">
              <details>
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crema text-lg">
                    🚚
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-extrabold">
                      {compra.proveedor ?? "Sin proveedor"}
                      {compra.factura ? ` · Factura ${compra.factura}` : ""}
                    </span>
                    <span className="block text-[11.5px] text-gris">
                      {horaLocal(compra.fecha, minutos)} · {PAGO[compra.metodo_pago ?? ""] ?? "—"}
                      {compra.usuario ? ` · ${compra.usuario}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-black">{formatearPrecio(compra.total)}</span>
                </summary>
                <ul className="space-y-1 border-t border-linea px-4 py-3">
                  {items
                    .filter((item) => item.compra_id === compra.id)
                    .map((item, indice) => (
                      <li key={indice} className="flex justify-between text-[12px]">
                        <span className="text-gris">
                          {item.cantidad} × {item.descripcion}
                        </span>
                        <span className="font-bold">{formatearPrecio(item.costo_unit * item.cantidad)}</span>
                      </li>
                    ))}
                  {compra.nota && <li className="pt-1 text-[11.5px] text-gris">{compra.nota}</li>}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-[74px] z-30 border-t border-linea bg-white p-3.5 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-14rem)] md:max-w-3xl">
        <Link
          href="/panel/compras/nueva"
          className="block rounded-xl bg-tinta py-3.5 text-center text-sm font-extrabold text-white transition hover:opacity-90"
        >
          ＋ Registrar compra
        </Link>
      </div>
    </div>
  );
}
