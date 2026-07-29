import Link from "next/link";
import { Banner } from "@/componentes/Banner";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { contarProductosPorCategoria, obtenerCategorias, obtenerProductos } from "@/lib/catalogo";
import { texto, textos } from "@/lib/i18n";
import { obtenerConfigTienda } from "@/lib/config-tienda";
import { idiomaActual } from "@/lib/idioma-servidor";

export default async function Portada() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const [categorias, destacados, conteo, config] = await Promise.all([
    obtenerCategorias(),
    obtenerProductos({ destacados: true }),
    contarProductosPorCategoria(),
    obtenerConfigTienda(),
  ]);

  const confianza = [
    { emoji: "🚢", titulo: t.importacionDirecta, detalle: t.importacionDirectaTexto },
    { emoji: "🛡️", titulo: t.garantia, detalle: t.garantiaTexto },
    { emoji: "💬", titulo: t.atencion, detalle: t.atencionTexto },
    { emoji: "📦", titulo: t.envios, detalle: t.enviosTexto },
  ];

  return (
    <>
      <div className="px-4 pt-4 lg:px-0 lg:pt-0">
        <Banner idioma={idioma} />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t.compraPorCategoria}</h2>
          <Link href="/catalogo" className="text-[13px] font-bold text-rojo hover:underline">
            {t.verTodas} →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:grid-cols-6 lg:gap-4">
          {categorias.map((categoria) => (
            <Link
              key={categoria.slug}
              href={`/categoria/${categoria.slug}`}
              className="rounded-2xl bg-crema px-3 py-5 text-center transition hover:bg-linea sm:py-6"
            >
              <span aria-hidden="true" className="block text-3xl sm:text-4xl">
                {categoria.emoji}
              </span>
              <span className="mt-2.5 block text-[11.5px] font-extrabold leading-tight sm:text-[13px]">
                {texto(categoria.nombre, idioma)}
              </span>
              <span className="mt-1 block text-[10.5px] text-gris sm:text-[11px]">
                {conteo[categoria.slug] ?? 0} {t.productos}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t.loMasVendido}</h2>
          <Link href="/catalogo" className="text-[13px] font-bold text-rojo hover:underline">
            {t.verCatalogoCompleto} →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {destacados.map((producto) => (
            <TarjetaProducto
              key={producto.slug}
              producto={producto}
              idioma={idioma}
              mostrarStock={config.mostrarStock}
            />
          ))}
        </div>
      </section>

      <section className="bg-tinta py-10 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 text-center sm:px-6 lg:grid-cols-4">
          {confianza.map((item) => (
            <div key={item.titulo}>
              <span aria-hidden="true" className="block text-3xl">
                {item.emoji}
              </span>
              <p className="mt-2 text-[13px] font-extrabold sm:text-sm">{item.titulo}</p>
              <p className="mt-1 text-[11.5px] text-[#9aa0aa] sm:text-xs">{item.detalle}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
