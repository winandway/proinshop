import { Suspense } from "react";
import Link from "next/link";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { OrdenarPor, type Orden } from "@/componentes/OrdenarPor";
import { obtenerCategorias, obtenerProductos } from "@/lib/catalogo";
import { texto, textos } from "@/lib/i18n";
import { idiomaActual } from "@/lib/idioma-servidor";

export default async function Catalogo({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; orden?: string }>;
}) {
  const parametros = await searchParams;
  const idioma = await idiomaActual();
  const t = textos(idioma);

  const orden = (["precio-asc", "precio-desc"].includes(parametros.orden ?? "")
    ? parametros.orden
    : "recientes") as Orden;

  const [productos, categorias] = await Promise.all([
    obtenerProductos({ buscar: parametros.q, orden }),
    obtenerCategorias(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
        {parametros.q ? `“${parametros.q}”` : t.catalogo}
      </h1>
      <p className="mt-1 text-sm text-gris">
        {productos.length} {productos.length === 1 ? t.producto : t.productos}
      </p>

      <div className="sin-barra mt-5 flex gap-2 overflow-x-auto">
        <Link
          href="/catalogo"
          className="whitespace-nowrap rounded-full border border-tinta bg-tinta px-4 py-2 text-xs font-bold text-white"
        >
          {t.verTodo}
        </Link>
        {categorias.map((categoria) => (
          <Link
            key={categoria.slug}
            href={`/categoria/${categoria.slug}`}
            className="whitespace-nowrap rounded-full border border-linea bg-white px-4 py-2 text-xs font-bold text-gris transition hover:border-gris2"
          >
            {texto(categoria.nombre, idioma)}
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
            <TarjetaProducto key={producto.slug} producto={producto} idioma={idioma} />
          ))}
        </div>
      )}
    </div>
  );
}
