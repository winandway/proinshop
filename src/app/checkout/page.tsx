import type { Metadata } from "next";
import { FormularioCheckout } from "@/componentes/FormularioCheckout";
import { obtenerProductos } from "@/lib/catalogo";
import { textos } from "@/lib/i18n";
import { idiomaActual } from "@/lib/idioma-servidor";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaActual();
  return { title: textos(idioma).finalizarPedido, robots: { index: false } };
}

export default async function PaginaCheckout() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const productos = await obtenerProductos();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-black tracking-tight sm:text-3xl">{t.finalizarPedido}</h1>
      <FormularioCheckout productos={productos} idioma={idioma} />
    </div>
  );
}
