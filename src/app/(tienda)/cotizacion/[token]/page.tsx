import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Diana } from "@/componentes/Logo";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { obtenerConfigTienda } from "@/lib/config-tienda";
import { enlaceWhatsapp, NEGOCIO } from "@/lib/config";

export const metadata: Metadata = { title: "Cotización", robots: { index: false } };

/**
 * Cotización que ve el cliente con el enlace que le pasaron.
 *
 * Abre sin cuenta: el token de la tabla es la llave. Sin esta página, el
 * enlace que genera el panel daba 404.
 */
export default async function CotizacionPublica({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = await baseDeDatos();
  if (!db) notFound();

  const cotizacion = await db
    .prepare(
      `SELECT q.id, q.estado, q.total, q.vence, q.creado_en, c.nombre AS cliente
       FROM cotizacion q LEFT JOIN cliente c ON c.id = q.cliente_id
       WHERE q.token_publico = ?`,
    )
    .bind(token)
    .first<{
      id: number;
      estado: string;
      total: number;
      vence: string | null;
      creado_en: string;
      cliente: string | null;
    }>();

  if (!cotizacion) notFound();

  const { results: items } = await db
    .prepare(
      "SELECT descripcion, cantidad, precio_unit FROM cotizacion_item WHERE cotizacion_id = ?",
    )
    .bind(cotizacion.id)
    .all<{ descripcion: string; cantidad: number; precio_unit: number }>();

  const config = await obtenerConfigTienda();
  const hoy = new Date().toISOString().slice(0, 10);
  const vencida = cotizacion.vence !== null && cotizacion.vence < hoy;

  const mensaje = `Hola, quiero aceptar la cotización #${cotizacion.id} de ${formatearPrecio(cotizacion.total)}.`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="rounded-3xl border border-linea p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-linea pb-5">
          <span className="inline-flex items-center gap-2.5">
            <Diana className="h-9 w-9 text-rojo" />
            <span className="text-lg font-black tracking-tight">PROINSHOP</span>
          </span>
          <div className="text-right">
            <p className="text-[13px] font-black">Cotización #{cotizacion.id}</p>
            <p className="text-[11.5px] text-gris">{cotizacion.creado_en.slice(0, 10)}</p>
          </div>
        </div>

        {cotizacion.cliente && (
          <p className="mt-5 text-[13px]">
            <span className="text-gris">Para: </span>
            <span className="font-bold">{cotizacion.cliente}</span>
          </p>
        )}

        <table className="mt-5 w-full text-[13px]">
          <thead>
            <tr className="border-b border-linea text-left text-[11px] uppercase tracking-wide text-gris">
              <th className="pb-2 font-bold">Producto</th>
              <th className="pb-2 text-center font-bold">Cant.</th>
              <th className="pb-2 text-right font-bold">Precio</th>
              <th className="pb-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, indice) => (
              <tr key={indice} className="border-b border-linea last:border-0">
                <td className="py-2.5">{item.descripcion}</td>
                <td className="py-2.5 text-center">{item.cantidad}</td>
                <td className="py-2.5 text-right text-gris">
                  {formatearPrecio(item.precio_unit)}
                </td>
                <td className="py-2.5 text-right font-bold">
                  {formatearPrecio(item.precio_unit * item.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 flex items-baseline justify-between border-t-2 border-tinta pt-4">
          <span className="font-black">Total</span>
          <span className="text-2xl font-black tracking-tight">
            {formatearPrecio(cotizacion.total)}
          </span>
        </div>

        {cotizacion.vence && (
          <p
            className={`mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold ${
              vencida ? "bg-rojo-suave text-rojo-oscuro" : "bg-crema text-gris"
            }`}
          >
            {vencida
              ? `Esta cotización venció el ${cotizacion.vence}. Escríbenos para actualizarla.`
              : `Válida hasta el ${cotizacion.vence}.`}
          </p>
        )}

        {cotizacion.estado === "aceptada" && (
          <p className="mt-3 rounded-xl bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde">
            Cotización aceptada. Gracias por tu compra.
          </p>
        )}

        {!vencida && cotizacion.estado !== "aceptada" && (
          <a
            href={enlaceWhatsapp(mensaje, config.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-2xl bg-whatsapp py-4 text-center text-sm font-extrabold text-white transition hover:brightness-95"
          >
            Aceptar por WhatsApp
          </a>
        )}

        <p className="mt-6 border-t border-linea pt-4 text-center text-[11px] text-gris2">
          © {new Date().getFullYear()} {NEGOCIO.dominio} | All rights reserved. Developed by{" "}
          <a
            href="https://windoce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-rojo"
          >
            Windoce LLC
          </a>
        </p>
      </div>
    </div>
  );
}
