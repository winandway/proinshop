import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";

export const metadata: Metadata = { title: "Gastos", robots: { index: false } };

export default async function Gastos() {
  const db = await baseDeDatos();

  const gastos = db
    ? (
        await db
          .prepare(
            `SELECT g.id, g.fecha, g.categoria, g.monto, g.metodo_pago, g.nota, g.recibo_r2,
                    p.nombre AS proveedor
             FROM gasto g LEFT JOIN proveedor p ON p.id = g.proveedor_id
             ORDER BY g.id DESC LIMIT 100`,
          )
          .all<{
            id: number;
            fecha: string;
            categoria: string;
            monto: number;
            metodo_pago: string | null;
            nota: string | null;
            recibo_r2: string | null;
            proveedor: string | null;
          }>()
      ).results
    : [];

  const delMes = db
    ? await db
        .prepare(
          `SELECT COALESCE(SUM(monto), 0) AS total FROM gasto
           WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')`,
        )
        .first<{ total: number }>()
    : null;

  return (
    <div className="pb-24">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Gastos</h1>
      </div>

      <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-[12px] font-semibold text-gris">Gastado este mes</p>
        <p className="mt-0.5 text-2xl font-black tracking-tight text-rojo">
          {formatearPrecio(delMes?.total ?? 0)}
        </p>
      </div>

      {gastos.length === 0 ? (
        <p className="rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          Todavía no hay gastos registrados.
        </p>
      ) : (
        <ul className="space-y-2">
          {gastos.map((gasto) => (
            <li key={gasto.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rojo-suave text-lg">
                💸
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold">{gasto.categoria}</span>
                <span className="block truncate text-[11.5px] text-gris">
                  {gasto.fecha.slice(0, 16).replace("T", " ")}
                  {gasto.proveedor ? ` · ${gasto.proveedor}` : ""}
                  {gasto.nota ? ` · ${gasto.nota}` : ""}
                </span>
              </span>
              {gasto.recibo_r2 && (
                <a
                  href={`/media/${gasto.recibo_r2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-gris hover:text-rojo"
                >
                  Recibo
                </a>
              )}
              <span className="shrink-0 text-[13.5px] font-black text-rojo">
                -{formatearPrecio(gasto.monto)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed inset-x-0 bottom-[74px] z-30 border-t border-linea bg-white p-3.5 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-14rem)] md:max-w-3xl">
        <Link
          href="/panel/gastos/nuevo"
          className="block rounded-xl bg-rojo py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
        >
          ＋ Registrar gasto
        </Link>
      </div>
    </div>
  );
}
