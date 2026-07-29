import Link from "next/link";
import { enlaceWhatsapp } from "@/lib/config";
import { formatearPrecio, textos } from "@/lib/i18n";
import type { PedidoPublico } from "@/lib/pedidos";
import type { Idioma } from "@/lib/tipos";

/**
 * Seguimiento del pedido. Se pinta en el servidor con lo que hay en la base,
 * así el estado que ve el cliente es el que puso el dueño y el enlace funciona
 * en cualquier dispositivo.
 */
export function SeguimientoPedido({
  numero,
  idioma,
  whatsapp,
  pedido,
}: {
  numero: string;
  idioma: Idioma;
  whatsapp: string;
  pedido: PedidoPublico | null;
}) {
  const t = textos(idioma);

  const ORDEN: PedidoPublico["estado"][] = ["nuevo", "preparando", "enviado", "entregado"];
  const actual = pedido ? ORDEN.indexOf(pedido.estado) : 0;
  const cancelado = pedido?.estado === "cancelado";

  const pasos = [
    { titulo: t.estadoRecibido },
    { titulo: t.estadoPreparando },
    { titulo: t.estadoCamino },
    { titulo: t.estadoEntregado },
  ];

  const mensaje =
    idioma === "es"
      ? `Hola, quiero consultar por mi pedido #${numero}`
      : `Hi, I'd like to check on my order #${numero}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl bg-linear-to-br from-[#ff3b3b] to-[#d91414] px-6 py-9 text-center text-white">
        <span
          aria-hidden="true"
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/20 text-4xl"
        >
          {cancelado ? "✕" : "✅"}
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight">
          {cancelado
            ? idioma === "es"
              ? "Pedido cancelado"
              : "Order cancelled"
            : t.pedidoConfirmado}
        </h1>
        <p className="mt-2 text-sm opacity-95">
          {t.pedido} <b>#{numero}</b>
          {!cancelado && ` · ${t.pedidoConfirmadoTexto}`}
        </p>
      </div>

      {!cancelado && (
        <ol className="mt-6 rounded-2xl border border-linea p-5">
          {pasos.map((paso, indice) => (
            <li key={paso.titulo} className="relative flex gap-4 pb-5 last:pb-0">
              {indice < pasos.length - 1 && (
                <span className="absolute left-[5px] top-4 h-full w-0.5 bg-linea" aria-hidden="true" />
              )}
              <span
                aria-hidden="true"
                className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${
                  indice < actual
                    ? "bg-verde"
                    : indice === actual
                      ? "bg-rojo ring-4 ring-rojo-suave"
                      : "bg-linea"
                }`}
              />
              <span>
                <span className="block text-[13px] font-extrabold">{paso.titulo}</span>
                <span className="block text-[11.5px] text-gris">
                  {indice < actual ? "✓" : indice === actual ? t.enProceso : "—"}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {pedido ? (
        <div className="mt-6 rounded-2xl border border-linea p-5">
          <h2 className="text-[13px] font-extrabold">{t.resumen}</h2>
          <ul className="mt-3 space-y-2.5">
            {pedido.lineas.map((linea, indice) => (
              <li
                key={`${linea.descripcion}-${indice}`}
                className="flex items-center gap-3 text-[13px]"
              >
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-bold">{linea.descripcion}</span>
                  <span className="block text-[11.5px] text-gris">
                    {linea.cantidad} × {formatearPrecio(linea.precioUnitario)}
                  </span>
                </span>
                <span className="font-black">
                  {formatearPrecio(linea.precioUnitario * linea.cantidad)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-dashed border-linea pt-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-gris">{t.subtotal}</dt>
              <dd className="font-bold">{formatearPrecio(pedido.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gris">{t.envio}</dt>
              <dd className="font-bold">
                {pedido.envio > 0 ? formatearPrecio(pedido.envio) : t.gratis}
              </dd>
            </div>
            <div className="flex justify-between pt-1">
              <dt className="font-black">{t.totalPagado}</dt>
              <dd className="text-xl font-black tracking-tight">
                {formatearPrecio(pedido.total)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-linea p-5 text-center text-sm text-gris">
          {idioma === "es"
            ? "No encontramos ese pedido. Revisa el número o escríbenos."
            : "We couldn't find that order. Check the number or message us."}
        </p>
      )}

      <a
        href={enlaceWhatsapp(mensaje, whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block rounded-2xl bg-whatsapp py-4 text-center text-sm font-extrabold text-white transition hover:brightness-95"
      >
        {t.escribirPorWhatsapp}
      </a>
      <Link
        href="/catalogo"
        className="mt-2.5 block rounded-2xl border-[1.5px] border-linea py-3.5 text-center text-sm font-extrabold transition hover:border-gris2"
      >
        {t.seguirComprando}
      </Link>
    </div>
  );
}
