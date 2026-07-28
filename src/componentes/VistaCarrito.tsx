"use client";

import Link from "next/link";
import { FotoProducto } from "./FotoProducto";
import { useCarrito } from "./carrito";
import { enlaceWhatsapp } from "@/lib/config";
import { formatearPrecio, texto, textos } from "@/lib/i18n";
import type { Idioma, Producto } from "@/lib/tipos";

export type LineaResuelta = {
  producto: Producto;
  varianteId: number | null;
  nombreVariante: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

/** Cruza lo guardado en el navegador con el catálogo que llega del servidor. */
export function resolverLineas(
  lineas: { productoSlug: string; varianteId: number | null; cantidad: number }[],
  productos: Producto[],
  idioma: Idioma,
): LineaResuelta[] {
  const resueltas: LineaResuelta[] = [];
  for (const linea of lineas) {
    const producto = productos.find((p) => p.slug === linea.productoSlug);
    if (!producto) continue;
    const variante = producto.variantes.find((v) => v.id === linea.varianteId) ?? null;
    const precioUnitario = producto.precio + (variante?.precioExtra ?? 0);
    resueltas.push({
      producto,
      varianteId: linea.varianteId,
      nombreVariante: variante ? texto(variante.nombre, idioma) : null,
      cantidad: linea.cantidad,
      precioUnitario,
      subtotal: precioUnitario * linea.cantidad,
    });
  }
  return resueltas;
}

export function VistaCarrito({
  productos,
  idioma,
}: {
  productos: Producto[];
  idioma: Idioma;
}) {
  const t = textos(idioma);
  const { lineas, listo, cambiarCantidad, quitar } = useCarrito();

  if (!listo) {
    return <div className="py-24 text-center text-sm text-gris">…</div>;
  }

  const resueltas = resolverLineas(lineas, productos, idioma);
  const subtotal = resueltas.reduce((suma, l) => suma + l.subtotal, 0);

  if (resueltas.length === 0) {
    return (
      <div className="py-20 text-center">
        <p aria-hidden="true" className="text-5xl">
          🛒
        </p>
        <p className="mt-4 text-lg font-extrabold">{t.carritoVacio}</p>
        <p className="mt-2 text-sm text-gris">{t.carritoVacioTexto}</p>
        <Link
          href="/catalogo"
          className="mt-6 inline-block rounded-2xl bg-rojo px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
        >
          {t.seguirComprando}
        </Link>
      </div>
    );
  }

  const mensaje =
    (idioma === "es" ? "Hola, quiero pedir:\n" : "Hi, I'd like to order:\n") +
    resueltas
      .map(
        (l) =>
          `• ${texto(l.producto.nombre, idioma)}${l.nombreVariante ? ` (${l.nombreVariante})` : ""} × ${l.cantidad}`,
      )
      .join("\n") +
    `\n${t.total}: ${formatearPrecio(subtotal)}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="space-y-3">
        {resueltas.map((linea) => (
          <li
            key={`${linea.producto.slug}-${linea.varianteId ?? "base"}`}
            className="flex gap-3 rounded-2xl border border-linea p-3 sm:gap-4 sm:p-4"
          >
            <Link
              href={`/producto/${linea.producto.slug}`}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-crema sm:h-24 sm:w-24"
            >
              <FotoProducto
                emoji={linea.producto.emoji}
                fotos={linea.producto.fotos}
                alt={texto(linea.producto.nombre, idioma)}
                tamano="pequeno"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/producto/${linea.producto.slug}`}
                className="line-clamp-2 text-[13.5px] font-bold hover:text-rojo sm:text-sm"
              >
                {texto(linea.producto.nombre, idioma)}
              </Link>
              {linea.nombreVariante && (
                <p className="mt-0.5 text-xs text-gris">{linea.nombreVariante}</p>
              )}
              <p className="mt-1 text-sm font-black">{formatearPrecio(linea.precioUnitario)}</p>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border-[1.5px] border-linea p-0.5">
                  <button
                    type="button"
                    aria-label="−"
                    onClick={() =>
                      cambiarCantidad(linea.producto.slug, linea.varianteId, linea.cantidad - 1)
                    }
                    className="grid h-7 w-7 place-items-center rounded-lg font-bold text-gris transition hover:bg-crema"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-[13px] font-extrabold">
                    {linea.cantidad}
                  </span>
                  <button
                    type="button"
                    aria-label="+"
                    onClick={() =>
                      cambiarCantidad(linea.producto.slug, linea.varianteId, linea.cantidad + 1)
                    }
                    className="grid h-7 w-7 place-items-center rounded-lg font-bold text-gris transition hover:bg-crema"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => quitar(linea.producto.slug, linea.varianteId)}
                  className="text-xs font-bold text-gris transition hover:text-rojo"
                >
                  {t.quitar}
                </button>
              </div>
            </div>

            <p className="shrink-0 text-sm font-black">{formatearPrecio(linea.subtotal)}</p>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border border-linea p-5 lg:sticky lg:top-32">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between text-gris">
            <dt>{t.subtotal}</dt>
            <dd className="font-bold text-tinta">{formatearPrecio(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-gris">
            <dt>{t.envio}</dt>
            <dd className="font-bold text-tinta">{t.envioSeCalcula}</dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-linea pt-3 text-base">
            <dt className="font-black">{t.total}</dt>
            <dd className="text-xl font-black tracking-tight">{formatearPrecio(subtotal)}</dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          className="mt-5 block rounded-2xl bg-rojo py-4 text-center text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
        >
          {t.continuarPedido}
        </Link>
        <a
          href={enlaceWhatsapp(mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 block rounded-2xl bg-whatsapp py-4 text-center text-sm font-extrabold text-white transition hover:brightness-95"
        >
          {t.comprarPorWhatsapp}
        </a>
        <Link
          href="/catalogo"
          className="mt-2.5 block rounded-2xl border-[1.5px] border-linea py-3.5 text-center text-sm font-extrabold transition hover:border-gris2"
        >
          {t.seguirComprando}
        </Link>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-tinta p-4 text-white">
          <span aria-hidden="true" className="text-xl">
            🚢
          </span>
          <div>
            <p className="text-[12.5px] font-extrabold">{t.importacionDirecta}</p>
            <p className="text-[11px] text-[#9aa0aa]">{t.importacionDirectaTexto}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
