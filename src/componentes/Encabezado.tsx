import Link from "next/link";
import { obtenerCategorias } from "@/lib/catalogo";
import { textos } from "@/lib/i18n";
import { idiomaActual } from "@/lib/idioma-servidor";
import { texto } from "@/lib/i18n";
import { Logo } from "./Logo";
import { SelectorIdioma } from "./SelectorIdioma";
import { BotonCarrito } from "./BotonCarrito";
import { Buscador } from "./Buscador";

export async function Encabezado() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const categorias = await obtenerCategorias();

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="bg-tinta px-4 py-2 text-center text-[11px] font-bold text-white sm:text-xs">
        <span className="sm:hidden">🚢 {t.envioCorto}</span>
        <span className="hidden sm:inline">🚢 {t.envioGratis}</span>
      </div>

      <div className="border-b border-linea">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <Link href="/" aria-label="Proinshop" className="shrink-0">
            <span className="hidden sm:inline-block">
              <Logo tamano="normal" />
            </span>
            <span className="sm:hidden">
              <Logo tamano="pequeno" />
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-bold text-[#3d424b] lg:flex">
            {categorias.slice(0, 5).map((categoria) => (
              <Link
                key={categoria.slug}
                href={`/categoria/${categoria.slug}`}
                className="whitespace-nowrap transition hover:text-rojo"
              >
                {texto(categoria.nombre, idioma)}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <Buscador marcador={t.buscar} />
            </div>
            <SelectorIdioma actual={idioma} />
            <BotonCarrito />
          </div>
        </div>

        <div className="px-4 pb-3 md:hidden">
          <Buscador marcador={t.buscarCorto} />
        </div>
      </div>
    </header>
  );
}
