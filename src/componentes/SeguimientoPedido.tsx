"use client";

import Link from "next/link";
import { enlaceWhatsapp } from "@/lib/config";
import { formatearPrecio, textos } from "@/lib/i18n";
import { leerPedido } from "@/lib/pedidos-navegador";
import type { Idioma } from "@/lib/tipos";
import { useEstaHidratado } from "./hooks";

export function SeguimientoPedido({
  numero,
  idioma,
}: {
  numero: string;
  idioma: Idioma;
}) {
  const t = textos(idioma);
  const hidratado = useEstaHidratado();
  const pedido = hidratado ? leerPedido(numero) : null;

  if (!hidratado) {
    return <div className="py-24 text-center text-sm text-gris">…</div>;
  }

  const pasos = [
    { titulo: t.estadoRecibido, estado: "hecho" as const },
    { titulo: t.estadoPreparando, estado: "actual" as const },
    { titulo: t.estadoCamino, estado: "pendiente" as const },
    { titulo: t.estadoEntregado, estado: "pendiente" as const },
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
          ✅
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight">{t.pedidoConfirmado}</h1>
        <p className="mt-2 text-sm opacity-95">
          {t.pedido} <b>#{numero}</b> · {t.pedidoConfirmadoTexto}
        </p>
      </div>

      <ol className="mt-6 rounded-2xl border border-linea p-5">
        {pasos.map((paso, indice) => (
          <li key={paso.titulo} className="relative flex gap-4 pb-5 last:pb-0">
            {indice < pasos.length - 1 && (
              <span className="absolute left-[5px] top-4 h-full w-0.5 bg-linea" aria-hidden="true" />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${
                paso.estado === "hecho"
                  ? "bg-verde"
                  : paso.estado === "actual"
                    ? "bg-rojo ring-4 ring-rojo-suave"
                    : "bg-linea"
              }`}
            />
            <span>
              <span className="block text-[13px] font-extrabold">{paso.titulo}</span>
              <span className="block text-[11.5px] text-gris">
                {paso.estado === "pendiente" ? "—" : paso.estado === "actual" ? t.enProceso : "✓"}
              </span>
            </span>
          </li>
        ))}
      </ol>

      {pedido ? (
        <div className="mt-6 rounded-2xl border border-linea p-5">
          <h2 className="text-[13px] font-extrabold">{t.resumen}</h2>
          <ul className="mt-3 space-y-3">
            {pedido.lineas.map((linea, indice) => (
              <li key={`${linea.nombre}-${indice}`} className="flex items-center gap-3 text-[13px]">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-lg bg-crema text-lg"
                >
                  {linea.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-bold">{linea.nombre}</span>
                  <span className="block text-[11.5px] text-gris">
                    {linea.cantidad} × {formatearPrecio(linea.precioUnitario)}
                    {linea.variante ? ` · ${linea.variante}` : ""}
                  </span>
                </span>
                <span className="font-black">
                  {formatearPrecio(linea.precioUnitario * linea.cantidad)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-dashed border-linea pt-4">
            <span className="font-black">{t.totalPagado}</span>
            <span className="text-xl font-black tracking-tight">
              {formatearPrecio(pedido.total)}
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-linea p-5 text-center text-sm text-gris">
          {idioma === "es"
            ? "El detalle de este pedido no está disponible en este dispositivo."
            : "The details for this order are not available on this device."}
        </p>
      )}

      <a
        href={enlaceWhatsapp(mensaje)}
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
