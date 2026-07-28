import Link from "next/link";
import { formatearPrecio, texto, textos } from "@/lib/i18n";
import type { Idioma, Producto } from "@/lib/tipos";
import { FotoProducto } from "./FotoProducto";

export function TarjetaProducto({
  producto,
  idioma,
}: {
  producto: Producto;
  idioma: Idioma;
}) {
  const t = textos(idioma);
  const nombre = texto(producto.nombre, idioma);
  const agotado = producto.stock <= 0;
  const pocas = producto.stock > 0 && producto.stock <= 2;

  return (
    <Link
      href={`/producto/${producto.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-linea bg-white transition hover:border-gris2 hover:shadow-lg"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-crema">
        <FotoProducto
          emoji={producto.emoji}
          fotos={producto.fotos}
          alt={nombre}
          className="transition duration-300 group-hover:scale-105"
        />
        {producto.etiqueta && (
          <span className="absolute left-3 top-3 rounded-md bg-rojo px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
            {texto(producto.etiqueta, idioma)}
          </span>
        )}
        {producto.precioAnterior && (
          <span className="absolute right-3 top-3 rounded-md bg-tinta px-2 py-1 text-[10px] font-black text-white">
            -{Math.round((1 - producto.precio / producto.precioAnterior) * 100)}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-10 text-[13.5px] font-bold leading-snug sm:text-sm">
          {nombre}
        </h3>

        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tight sm:text-2xl">
            {formatearPrecio(producto.precio)}
          </span>
          {producto.precioAnterior && (
            <s className="text-xs font-semibold text-gris2">
              {formatearPrecio(producto.precioAnterior)}
            </s>
          )}
        </p>

        <p
          className={`mt-1.5 text-[11.5px] font-bold ${
            agotado ? "text-gris2" : pocas ? "text-ambar" : "text-verde"
          }`}
        >
          {agotado
            ? t.agotado
            : pocas
              ? `● ${t.ultimasUnidades} · ${producto.stock}`
              : `● ${producto.stock} ${t.disponibles}`}
        </p>

        <span className="mt-4 block rounded-xl bg-rojo py-2.5 text-center text-[13px] font-extrabold text-white transition group-hover:bg-rojo-oscuro">
          {t.agregarAlCarrito}
        </span>
      </div>
    </Link>
  );
}
