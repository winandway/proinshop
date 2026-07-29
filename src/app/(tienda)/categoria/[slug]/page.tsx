import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { OrdenarPor, type Orden } from "@/componentes/OrdenarPor";
import { obtenerCategoria, obtenerCategorias, obtenerProductos } from "@/lib/catalogo";
import { texto, textos } from "@/lib/i18n";
import { obtenerConfigTienda } from "@/lib/config-tienda";
import { idiomaActual } from "@/lib/idioma-servidor";

// Sin `generateStaticParams`: las categorías las administra el dueño desde la
// app, así que se resuelven en cada visita.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoria = await obtenerCategoria(slug);
  if (!categoria) return {};
  const idioma = await idiomaActual();
  return { title: texto(categoria.nombre, idioma) };
}

export default async function PaginaCategoria({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orden?: string }>;
}) {
  const { slug } = await params;
  const categoria = await obtenerCategoria(slug);
  if (!categoria) notFound();

  const parametros = await searchParams;
  const idioma = await idiomaActual();
  const t = textos(idioma);

  const orden = (["precio-asc", "precio-desc"].includes(parametros.orden ?? "")
    ? parametros.orden
    : "recientes") as Orden;

  const [productos, categorias, config] = await Promise.all([
    obtenerProductos({ categoriaSlug: slug, orden }),
    obtenerCategorias(),
    obtenerConfigTienda(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-4 text-xs font-semibold text-gris">
        <Link href="/" className="hover:text-rojo">
          {idioma === "es" ? "Inicio" : "Home"}
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/catalogo" className="hover:text-rojo">
          {t.catalogo}
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-4xl">
          {categoria.emoji}
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {texto(categoria.nombre, idioma)}
          </h1>
          <p className="mt-0.5 text-sm text-gris">
            {productos.length} {productos.length === 1 ? t.producto : t.productos}
          </p>
        </div>
      </div>

      <div className="sin-barra mt-5 flex gap-2 overflow-x-auto">
        <Link
          href="/catalogo"
          className="whitespace-nowrap rounded-full border border-linea bg-white px-4 py-2 text-xs font-bold text-gris transition hover:border-gris2"
        >
          {t.verTodo}
        </Link>
        {categorias.map((otra) => (
          <Link
            key={otra.slug}
            href={`/categoria/${otra.slug}`}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
              otra.slug === slug
                ? "border-tinta bg-tinta text-white"
                : "border-linea bg-white text-gris hover:border-gris2"
            }`}
          >
            {texto(otra.nombre, idioma)}
          </Link>
        ))}
      </div>

      <div className="mt-3">
        <Suspense fallback={null}>
          <OrdenarPor
            actual={orden}
            etiquetas={{
              recientes: t.masRecientes,
              "precio-asc": t.precioMenor,
              "precio-desc": t.precioMayor,
            }}
          />
        </Suspense>
      </div>

      {productos.length === 0 ? (
        <div className="mt-14 text-center">
          <p className="text-lg font-extrabold">{t.sinResultados}</p>
          <p className="mt-2 text-sm text-gris">{t.sinResultadosTexto}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {productos.map((producto) => (
            <TarjetaProducto
              key={producto.slug}
              producto={producto}
              idioma={idioma}
              mostrarStock={config.mostrarStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
