import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Balance", robots: { index: false } };

const RANGOS = {
  dia: { texto: "Día", filtro: "date(fecha) = date('now')" },
  mes: { texto: "Mes", filtro: "strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')" },
  ano: { texto: "Año", filtro: "strftime('%Y', fecha) = strftime('%Y', 'now')" },
} as const;

type Rango = keyof typeof RANGOS;

export default async function Balance({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  // La utilidad y el costo de la mercancía son del dueño: un empleado no
  // tiene por qué saber cuánto gana el negocio.
  const usuario = await usuarioActual();
  if (usuario?.rol !== "dueno") redirect("/panel");

  const { rango } = await searchParams;
  const elegido: Rango = rango === "dia" || rango === "ano" ? rango : "mes";
  const filtro = RANGOS[elegido].filtro;

  const db = await baseDeDatos();

  const cifras = db
    ? await db
        .prepare(
          `SELECT
             (SELECT COALESCE(SUM(total), 0) FROM venta WHERE ${filtro}) AS ingresos,
             (SELECT COALESCE(SUM(monto), 0) FROM gasto WHERE ${filtro}) AS egresos,
             (SELECT COALESCE(SUM(vi.costo_unit * vi.cantidad), 0)
                FROM venta_item vi JOIN venta v ON v.id = vi.venta_id
                WHERE ${filtro.replace(/fecha/g, "v.fecha")}) AS costo_vendido,
             (SELECT COUNT(*) FROM venta WHERE ${filtro}) AS ventas`,
        )
        .first<{ ingresos: number; egresos: number; costo_vendido: number; ventas: number }>()
    : null;

  const ingresos = cifras?.ingresos ?? 0;
  const egresos = cifras?.egresos ?? 0;
  const utilidad = ingresos - egresos;
  const gananciaBruta = ingresos - (cifras?.costo_vendido ?? 0);

  const porCategoria = db
    ? (
        await db
          .prepare(
            `SELECT categoria, SUM(monto) AS total FROM gasto WHERE ${filtro}
             GROUP BY categoria ORDER BY total DESC LIMIT 6`,
          )
          .all<{ categoria: string; total: number }>()
      ).results
    : [];

  const mayor = porCategoria[0]?.total ?? 1;

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Balance</h1>

      <div className="sin-barra mb-3 flex gap-2 overflow-x-auto">
        {(Object.keys(RANGOS) as Rango[]).map((clave) => (
          <Link
            key={clave}
            href={`/panel/balance?rango=${clave}`}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
              elegido === clave
                ? "border-tinta bg-tinta text-white"
                : "border-linea bg-white text-gris"
            }`}
          >
            {RANGOS[clave].texto}
          </Link>
        ))}
      </div>

      <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <dl className="space-y-2.5 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-gris">↗ Ingresos</dt>
            <dd className="text-[17px] font-black text-verde">{formatearPrecio(ingresos)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gris">↙ Egresos</dt>
            <dd className="text-[17px] font-black text-rojo">-{formatearPrecio(egresos)}</dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-linea pt-2.5">
            <dt className="font-black">Utilidad</dt>
            <dd
              className={`text-xl font-black tracking-tight ${
                utilidad >= 0 ? "text-tinta" : "text-rojo"
              }`}
            >
              {formatearPrecio(utilidad)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mb-3 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Ventas</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">{cifras?.ventas ?? 0}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Ganancia bruta</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">
            {formatearPrecio(gananciaBruta)}
          </p>
          <p className="text-[10.5px] text-gris2">precio menos costo</p>
        </div>
      </div>

      {porCategoria.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[13px] font-extrabold">A dónde se va el dinero</h2>
          {porCategoria.map((fila) => (
            <div key={fila.categoria} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-[12.5px]">
                <span className="text-gris">{fila.categoria}</span>
                <span className="font-bold">{formatearPrecio(fila.total)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-crema">
                <div
                  className="h-full rounded-full bg-rojo"
                  style={{ width: `${Math.round((fila.total / mayor) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
