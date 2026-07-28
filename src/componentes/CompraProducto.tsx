"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enlaceWhatsapp, NEGOCIO } from "@/lib/config";
import { formatearPrecio, texto, textos } from "@/lib/i18n";
import type { Idioma, Producto } from "@/lib/tipos";
import { useCarrito } from "./carrito";

export function CompraProducto({
  producto,
  idioma,
}: {
  producto: Producto;
  idioma: Idioma;
}) {
  const t = textos(idioma);
  const router = useRouter();
  const { agregar } = useCarrito();

  const [varianteId, setVarianteId] = useState<number | null>(
    producto.variantes.length > 0 ? producto.variantes[0].id : null,
  );
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const variante = producto.variantes.find((v) => v.id === varianteId) ?? null;
  const precio = producto.precio + (variante?.precioExtra ?? 0);
  const stock = variante ? variante.stock : producto.stock;
  const agotado = stock <= 0;

  function alAgregar() {
    if (agotado) return;
    agregar({ productoSlug: producto.slug, varianteId, cantidad });
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1600);
  }

  const mensaje =
    idioma === "es"
      ? `Hola, me interesa: ${texto(producto.nombre, idioma)}${
          variante ? ` (${texto(variante.nombre, idioma)})` : ""
        } — ${NEGOCIO.url}/producto/${producto.slug}`
      : `Hi, I'm interested in: ${texto(producto.nombre, idioma)}${
          variante ? ` (${texto(variante.nombre, idioma)})` : ""
        } — ${NEGOCIO.url}/producto/${producto.slug}`;

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-black tracking-tight sm:text-4xl">
          {formatearPrecio(precio)}
        </span>
        {producto.precioAnterior && (
          <s className="text-base font-semibold text-gris2">
            {formatearPrecio(producto.precioAnterior)}
          </s>
        )}
        {producto.precioAnterior && (
          <span className="rounded-md bg-rojo-suave px-2 py-1 text-[11px] font-black text-rojo-oscuro">
            -{Math.round((1 - producto.precio / producto.precioAnterior) * 100)}%
          </span>
        )}
      </p>
      <p className="mt-1.5 text-xs text-gris">{t.consultaMayoreo}</p>

      {producto.variantes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2.5 text-[13px] font-extrabold">{t.modelo}</h2>
          <div className="flex flex-wrap gap-2">
            {producto.variantes.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => setVarianteId(opcion.id)}
                aria-pressed={opcion.id === varianteId}
                className={`rounded-xl border-[1.5px] px-4 py-2.5 text-[12.5px] font-bold transition ${
                  opcion.id === varianteId
                    ? "border-rojo bg-rojo-suave text-rojo-oscuro"
                    : "border-linea bg-white text-tinta hover:border-gris2"
                }`}
              >
                {texto(opcion.nombre, idioma)}
                {opcion.precioExtra > 0 && ` +${formatearPrecio(opcion.precioExtra)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <span className="text-[13px] font-extrabold">{t.cantidad}</span>
        <div className="flex items-center gap-1 rounded-xl border-[1.5px] border-linea p-1">
          <button
            type="button"
            onClick={() => setCantidad((n) => Math.max(1, n - 1))}
            aria-label="−"
            className="grid h-8 w-8 place-items-center rounded-lg text-lg font-bold text-gris transition hover:bg-crema"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-extrabold">{cantidad}</span>
          <button
            type="button"
            onClick={() => setCantidad((n) => Math.min(Math.max(stock, 1), n + 1))}
            aria-label="+"
            className="grid h-8 w-8 place-items-center rounded-lg text-lg font-bold text-gris transition hover:bg-crema"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={alAgregar}
          disabled={agotado}
          className={`flex-1 rounded-2xl py-4 text-sm font-extrabold text-white transition ${
            agotado
              ? "cursor-not-allowed bg-gris2"
              : agregado
                ? "bg-verde"
                : "bg-rojo hover:bg-rojo-oscuro"
          }`}
        >
          {agotado ? t.agotado : agregado ? `✓ ${t.agregado}` : t.agregarAlCarrito}
        </button>
        <a
          href={enlaceWhatsapp(mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-whatsapp px-6 py-4 text-center text-sm font-extrabold text-white transition hover:brightness-95"
        >
          💬 <span className="sm:hidden">{t.comprarPorWhatsapp}</span>
        </a>
      </div>

      {agregado && (
        <button
          type="button"
          onClick={() => router.push("/carrito")}
          className="mt-2.5 w-full rounded-2xl border-[1.5px] border-linea py-3.5 text-sm font-extrabold transition hover:border-gris2"
        >
          {t.tuCarrito} →
        </button>
      )}
    </div>
  );
}
