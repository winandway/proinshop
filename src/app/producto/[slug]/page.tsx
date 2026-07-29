import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CompraProducto } from "@/componentes/CompraProducto";
import { FotoProducto } from "@/componentes/FotoProducto";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { obtenerCategoria, obtenerProducto, obtenerProductos } from "@/lib/catalogo";
import { formatearPrecio, texto, textos } from "@/lib/i18n";
import { idiomaActual } from "@/lib/idioma-servidor";

// Sin `generateStaticParams`: el catálogo vive en la base y cambia cuando el
// dueño carga productos, así que las fichas se arman en cada visita.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) return {};
  const idioma = await idiomaActual();
  const nombre = texto(producto.nombre, idioma);
  const descripcion = texto(producto.descripcion, idioma);

  // Si el producto ya tiene foto, esa es la miniatura al compartirlo por
  // WhatsApp. Si no la tiene, se nombra la tarjeta de la marca a propósito:
  // al declarar `openGraph` aquí, Next reemplaza el del layout, y sin esta
  // línea el enlace se compartiría sin miniatura.
  const imagenes = producto.fotos.length
    ? [{ url: `/media/${producto.fotos[0]}`, alt: nombre }]
    : [{ url: "/opengraph-image.png", alt: "Proinshop", width: 1200, height: 630 }];

  return {
    title: nombre,
    description: descripcion,
    openGraph: {
      title: `${nombre} · ${formatearPrecio(producto.precio)}`,
      description: descripcion,
      type: "website",
      images: imagenes,
    },
    twitter: {
      card: "summary_large_image",
      title: `${nombre} · ${formatearPrecio(producto.precio)}`,
      description: descripcion,
      images: imagenes?.map((i) => i.url),
    },
  };
}

export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) notFound();

  const idioma = await idiomaActual();
  const t = textos(idioma);
  const categoria = await obtenerCategoria(producto.categoriaSlug);
  const relacionados = (await obtenerProductos({ categoriaSlug: producto.categoriaSlug }))
    .filter((otro) => otro.slug !== producto.slug)
    .slice(0, 4);

  const nombre = texto(producto.nombre, idioma);
  const pocas = producto.stock > 0 && producto.stock <= 2;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <nav className="mb-5 text-xs font-semibold text-gris">
        <Link href="/" className="hover:text-rojo">
          {idioma === "es" ? "Inicio" : "Home"}
        </Link>
        {categoria && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/categoria/${categoria.slug}`} className="hover:text-rojo">
              {texto(categoria.nombre, idioma)}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-crema">
            <FotoProducto
              emoji={producto.emoji}
              fotos={producto.fotos}
              alt={nombre}
              tamano="grande"
            />
          </div>
        </div>

        <div>
          <p
            className={`text-[11.5px] font-extrabold ${
              producto.stock <= 0 ? "text-gris2" : pocas ? "text-ambar" : "text-verde"
            }`}
          >
            {producto.stock <= 0
              ? t.agotado
              : pocas
                ? `● ${t.ultimasUnidades} · ${producto.stock}`
                : `● ${producto.stock} ${t.disponibles}`}
          </p>

          <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            {nombre}
          </h1>
          <p className="mt-1.5 text-xs text-gris">SKU {producto.sku}</p>

          <div className="mt-5">
            <CompraProducto producto={producto} idioma={idioma} />
          </div>

          <div className="mt-9">
            <h2 className="text-[13px] font-extrabold">{t.descripcion}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-gris">
              {texto(producto.descripcion, idioma)}
            </p>
          </div>

          {producto.especificaciones.length > 0 && (
            <div className="mt-8">
              <h2 className="text-[13px] font-extrabold">{t.especificaciones}</h2>
              <dl className="mt-2">
                {producto.especificaciones.map((fila) => (
                  <div
                    key={fila.etiqueta.es}
                    className="flex justify-between border-b border-linea py-2.5 text-[13px] last:border-0"
                  >
                    <dt className="text-gris">{texto(fila.etiqueta, idioma)}</dt>
                    <dd className="font-bold">{texto(fila.valor, idioma)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-xl font-black tracking-tight">
            {categoria ? texto(categoria.nombre, idioma) : t.catalogo}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {relacionados.map((otro) => (
              <TarjetaProducto key={otro.slug} producto={otro} idioma={idioma} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
