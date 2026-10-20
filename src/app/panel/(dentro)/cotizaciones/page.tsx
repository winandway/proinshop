import type { Metadata } from "next";
import { CrearCotizacion } from "@/componentes/panel/CrearCotizacion";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { NEGOCIO } from "@/lib/config";
import { listaClientes, productosParaVender } from "@/lib/negocio";
import { exigir } from "@/lib/sesion";
import { cambiarEstadoCotizacion, convertirEnVenta } from "./acciones";

export const metadata: Metadata = { title: "Cotizaciones", robots: { index: false } };

const COLOR: Record<string, string> = {
  enviada: "bg-[#fff6df] text-[#8a6100]",
  aceptada: "bg-verde-suave text-verde",
  vencida: "bg-crema text-gris",
  borrador: "bg-crema text-gris",
};

export default async function Cotizaciones({
  searchParams,
}: {
  searchParams: Promise<{ sin_stock?: string; sin_cliente?: string }>;
}) {
  await exigir("cotizaciones");
  const { sin_stock, sin_cliente } = await searchParams;
  const db = await baseDeDatos();
  const [productos, clientes] = await Promise.all([productosParaVender(), listaClientes()]);

  const cotizaciones = db
    ? (
        await db
          .prepare(
            `SELECT q.id, q.estado, q.total, q.vence, q.token_publico, q.creado_en, q.venta_id,
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
            venta_id: number | null;
            cliente: string | null;
            articulos: number;
          }>()
      ).results
    : [];

  const aceptadas = cotizaciones.filter((c) => c.estado === "aceptada").length;

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Cotizaciones</h1>

      {sin_stock && (
        <p role="alert" className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro">
          La cotización #{sin_stock} pide más unidades de las que hay en stock. Registra la compra o
          ajusta el inventario antes de venderla.
        </p>
      )}
      {sin_cliente && (
        <p role="alert" className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro">
          La cotización #{sin_cliente} no tiene cliente: para venderla fiada hace falta uno.
        </p>
      )}

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

              <div className="mt-2.5 flex flex-wrap gap-2">
                {cotizacion.token_publico && (
                  <a
                    href={`/cotizacion/${cotizacion.token_publico}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border-[1.5px] border-linea px-3 py-1.5 text-[11.5px] font-bold transition hover:border-gris2"
                  >
                    Ver / imprimir ↗
                  </a>
                )}
                {cotizacion.venta_id ? (
                  <a
                    href={`/panel/vender/${cotizacion.venta_id}`}
                    className="rounded-lg bg-verde-suave px-3 py-1.5 text-[11.5px] font-bold text-verde"
                  >
                    Vendida · venta #{cotizacion.venta_id}
                  </a>
                ) : (
                  cotizacion.estado !== "vencida" && (
                    <form action={convertirEnVenta} className="flex gap-1.5">
                      <input type="hidden" name="id" value={cotizacion.id} />
                      <select
                        name="metodo_pago"
                        defaultValue="efectivo"
                        aria-label="Cómo pagó"
                        className="rounded-lg border-[1.5px] border-linea px-2 py-1.5 text-[11.5px] font-bold outline-none"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="fiado">Fiado</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-tinta px-3 py-1.5 text-[11.5px] font-bold text-white"
                      >
                        Convertir en venta
                      </button>
                    </form>
                  )
                )}
              </div>

              {cotizacion.estado === "enviada" && !cotizacion.venta_id && (
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
