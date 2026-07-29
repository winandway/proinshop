import type { Metadata } from "next";
import { CrearCotizacion } from "@/componentes/panel/CrearCotizacion";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { NEGOCIO } from "@/lib/config";
import { listaClientes, productosParaVender } from "@/lib/negocio";
import { cambiarEstadoCotizacion } from "./acciones";

export const metadata: Metadata = { title: "Cotizaciones", robots: { index: false } };

const COLOR: Record<string, string> = {
  enviada: "bg-[#fff6df] text-[#8a6100]",
  aceptada: "bg-verde-suave text-verde",
  vencida: "bg-crema text-gris",
  borrador: "bg-crema text-gris",
};

export default async function Cotizaciones() {
  const db = await baseDeDatos();
  const [productos, clientes] = await Promise.all([productosParaVender(), listaClientes()]);

  const cotizaciones = db
    ? (
        await db
          .prepare(
            `SELECT q.id, q.estado, q.total, q.vence, q.token_publico, q.creado_en,
                    c.nombre AS cliente,
                    (SELECT COUNT(*) FROM cotizacion_item WHERE cotizacion_id = q.id) AS articulos
             FROM cotizacion q LEFT JOIN cliente c ON c.id = q.cliente_id
             ORDER BY q.id DESC LIMIT 50`,
          )
          .all<{
            id: number;
            estado: string;
            total: number;
            vence: string | null;
            token_publico: string | null;
            creado_en: string;
            cliente: string | null;
            articulos: number;
          }>()
      ).results
    : [];

  const aceptadas = cotizaciones.filter((c) => c.estado === "aceptada").length;

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Cotizaciones</h1>

      <div className="mb-3 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Creadas</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">{cotizaciones.length}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Aceptadas</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">{aceptadas}</p>
          {cotizaciones.length > 0 && (
            <p className="text-[10.5px] font-extrabold text-verde">
              {Math.round((aceptadas / cotizaciones.length) * 100)}% de cierre
            </p>
          )}
        </div>
      </div>

      {cotizaciones.length > 0 && (
        <ul className="mb-4 space-y-2">
          {cotizaciones.map((cotizacion) => (
            <li key={cotizacion.id} className="rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crema text-lg">
                  📄
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-extrabold">
                    Cotización #{cotizacion.id}
                  </span>
                  <span className="block truncate text-[11.5px] text-gris">
                    {cotizacion.cliente ?? "Sin cliente"} · {cotizacion.articulos} producto(s)
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13.5px] font-black">
                    {formatearPrecio(cotizacion.total)}
                  </span>
                  <span
                    className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-[9.5px] font-extrabold capitalize ${
                      COLOR[cotizacion.estado] ?? "bg-crema text-gris"
                    }`}
                  >
                    {cotizacion.estado}
                  </span>
                </span>
              </div>

              {cotizacion.estado === "enviada" && (
                <form action={cambiarEstadoCotizacion} className="mt-2.5">
                  <input type="hidden" name="id" value={cotizacion.id} />
                  <input type="hidden" name="estado" value="aceptada" />
                  <button
                    type="submit"
                    className="w-full rounded-lg border-[1.5px] border-linea py-2 text-[11.5px] font-bold transition hover:border-verde hover:text-verde"
                  >
                    Marcar como aceptada
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <CrearCotizacion productos={productos} clientes={clientes} dominio={NEGOCIO.url} />
    </>
  );
}
