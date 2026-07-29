import type { Metadata } from "next";
import { VistaCarrito } from "@/componentes/VistaCarrito";
import { obtenerProductos } from "@/lib/catalogo";
import { textos } from "@/lib/i18n";
import { idiomaActual } from "@/lib/idioma-servidor";
import { obtenerConfigTienda } from "@/lib/config-tienda";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaActual();
  return { title: textos(idioma).tuCarrito, robots: { index: false } };
}

export default async function PaginaCarrito() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const [productos, config] = await Promise.all([obtenerProductos(), obtenerConfigTienda()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-black tracking-tight sm:text-3xl">{t.tuCarrito}</h1>
      <VistaCarrito productos={productos} idioma={idioma} whatsapp={config.whatsapp} />
    </div>
  );
}
