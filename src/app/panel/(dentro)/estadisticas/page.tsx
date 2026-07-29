import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Estadísticas", robots: { index: false } };

export default async function Estadisticas() {
  const usuario = await usuarioActual();
  if (usuario?.rol !== "dueno") redirect("/panel");

  const db = await baseDeDatos();

  const resumen = db
    ? await db
        .prepare(
          `SELECT
             (SELECT COALESCE(SUM(total), 0) FROM venta
               WHERE fecha >= datetime('now', '-15 days')) AS ventas,
             (SELECT COALESCE(SUM(total), 0) FROM venta
               WHERE fecha >= datetime('now', '-30 days') AND fecha < datetime('now', '-15 days')) AS ventas_previas,
             (SELECT COALESCE(SUM(monto), 0) FROM gasto
               WHERE fecha >= datetime('now', '-15 days')) AS gastos,
             (SELECT COUNT(*) FROM pedido WHERE fecha >= datetime('now', '-15 days')) AS pedidos`,
        )
        .first<{ ventas: number; ventas_previas: number; gastos: number; pedidos: number }>()
    : null;

  const porDia = db
    ? (
        await db
          .prepare(
            `SELECT date(fecha) AS dia, SUM(total) AS total FROM venta
             WHERE fecha >= datetime('now', '-7 days')
             GROUP BY dia ORDER BY dia`,
          )
          .all<{ dia: string; total: number }>()
      ).results
    : [];

  const masVendidos = db
    ? (
        await db
          .prepare(
            `SELECT vi.descripcion, SUM(vi.cantidad) AS unidades,
                    SUM(vi.precio_unit * vi.cantidad) AS total
             FROM venta_item vi JOIN venta v ON v.id = vi.venta_id
             WHERE v.fecha >= datetime('now', '-30 days')
             GROUP BY vi.descripcion ORDER BY unidades DESC LIMIT 5`,
          )
          .all<{ descripcion: string; unidades: number; total: number }>()
      ).results
    : [];

  const porCanal = db
    ? (
        await db
          .prepare(
            `SELECT canal, COUNT(*) AS ventas, COALESCE(SUM(total), 0) AS total
             FROM venta WHERE fecha >= datetime('now', '-30 days') GROUP BY canal`,
          )
          .all<{ canal: string; ventas: number; total: number }>()
      ).results
    : [];

  const ventas = resumen?.ventas ?? 0;
  const previas = resumen?.ventas_previas ?? 0;
  const variacion = previas > 0 ? Math.round(((ventas - previas) / previas) * 100) : null;
  const totalCanales = porCanal.reduce((suma, c) => suma + c.total, 0) || 1;
  const maximoDia = Math.max(...porDia.map((d) => d.total), 1);

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Estadísticas</h1>
      <p className="mb-3 text-[12px] text-gris">Últimos 15 días</p>

      <div className="mb-2.5 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Total ventas</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">{formatearPrecio(ventas)}</p>
          {variacion !== null && (
            <p
              className={`mt-0.5 text-[10.5px] font-extrabold ${
                variacion >= 0 ? "text-verde" : "text-rojo"
              }`}
            >
              {variacion >= 0 ? "↑" : "↓"} {Math.abs(variacion)}% vs. quincena anterior
            </p>
          )}
        </div>
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Ganancia</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">
            {formatearPrecio(ventas - (resumen?.gastos ?? 0))}
          </p>
        </div>
      </div>

      <div className="mb-3 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Total gastos</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">
            {formatearPrecio(resumen?.gastos ?? 0)}
          </p>
        </div>
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Pedidos web</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">{resumen?.pedidos ?? 0}</p>
        </div>
      </div>

      {porDia.length > 0 && (
        <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[13px] font-extrabold">Ventas por día</h2>
          <div className="flex h-28 items-end gap-1.5">
            {porDia.map((dia) => (
              <div key={dia.dia} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-rojo"
                  style={{ height: `${Math.max(4, Math.round((dia.total / maximoDia) * 100))}%` }}
                  title={`${dia.dia}: ${formatearPrecio(dia.total)}`}
                />
                <span className="text-[9px] text-gris2">{dia.dia.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {masVendidos.length > 0 && (
        <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[13px] font-extrabold">Lo que más vendes</h2>
          <ul className="space-y-2.5">
            {masVendidos.map((producto) => (
              <li key={producto.descripcion} className="flex items-center gap-3 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{producto.descripcion}</span>
                  <span className="block text-[11.5px] text-gris">
                    {producto.unidades} unidades
                  </span>
                </span>
                <span className="font-black">{formatearPrecio(producto.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {porCanal.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[13px] font-extrabold">Ventas por canal</h2>
          {porCanal.map((canal) => (
            <div key={canal.canal} className="mb-2 flex justify-between text-[13px] last:mb-0">
              <span className="text-gris">
                {canal.canal === "web" ? "🌐 Tienda virtual" : "🏪 Local"}
              </span>
              <span className="font-bold">
                {Math.round((canal.total / totalCanales) * 100)}% ·{" "}
                {formatearPrecio(canal.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
