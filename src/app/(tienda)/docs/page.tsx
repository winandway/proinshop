import Link from "next/link";
import type { Metadata } from "next";
import { idiomaActual } from "@/lib/idioma-servidor";
import { GUIAS, SECCIONES_DOCS, normalizarBusqueda, textoPlano } from "@/lib/docs";
import { BuscadorDocs } from "@/componentes/docs/BuscadorDocs";

export async function generateMetadata(): Promise<Metadata> {
  const es = (await idiomaActual()) === "es";
  return {
    title: "Docs",
    description: es
      ? "Guías de Proinshop: cómo vender, cobrar, llevar el inventario, la caja, los clientes y la tienda en línea."
      : "Proinshop guides: how to sell, take payments, manage inventory, the cash register, customers and your online store.",
    alternates: { canonical: "/docs" },
  };
}

export default async function PortadaDocs() {
  const idioma = await idiomaActual();
  const es = idioma === "es";

  const indice = GUIAS.map((guia) => ({
    slug: guia.slug,
    icono: guia.icono,
    titulo: guia.titulo[idioma],
    resumen: guia.resumen[idioma],
    seccion: SECCIONES_DOCS.find((s) => s.id === guia.seccion)?.titulo[idioma] ?? "",
    texto: normalizarBusqueda(textoPlano(guia, idioma)),
  }));

  return (
    <>
      <div className="mb-8">
        <p className="text-[12px] font-extrabold uppercase tracking-wider text-rojo">Docs</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
          {es ? "¿Cómo te ayudamos?" : "How can we help?"}
        </h1>
        <p className="mb-5 mt-2 max-w-2xl text-[14.5px] text-gris">
          {es
            ? "Guías cortas, paso a paso, para sacarle todo el provecho a tu panel y a tu tienda."
            : "Short, step-by-step guides to get the most out of your dashboard and your store."}
        </p>
        <BuscadorDocs indice={indice} idioma={idioma} grande />
      </div>

      {SECCIONES_DOCS.map((seccion) => {
        const guias = GUIAS.filter((guia) => guia.seccion === seccion.id);
        return (
          <section key={seccion.id} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-black">
              <span aria-hidden="true">{seccion.icono}</span>
              {seccion.titulo[idioma]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {guias.map((guia) => (
                <Link
                  key={guia.slug}
                  href={`/docs/${guia.slug}`}
                  className="group rounded-2xl border border-linea bg-white p-4 transition hover:border-rojo/40 hover:shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-xl">
                      {guia.icono}
                    </span>
                    <span className="text-[14px] font-extrabold text-tinta group-hover:text-rojo-oscuro">
                      {guia.titulo[idioma]}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[12.5px] leading-snug text-gris">{guia.resumen[idioma]}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
