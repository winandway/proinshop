import { idiomaActual } from "@/lib/idioma-servidor";
import { GUIAS, SECCIONES_DOCS, normalizarBusqueda, textoPlano } from "@/lib/docs";
import { MenuDocs, type SeccionMenu } from "@/componentes/docs/MenuDocs";
import { BuscadorDocs, type EntradaIndice } from "@/componentes/docs/BuscadorDocs";

/**
 * Marco de Docs: la barra de guías a la izquierda y el contenido a la
 * derecha. Envuelve todas las páginas de Docs, así la barra nunca se pierde.
 */
export default async function DisenoDocs({ children }: { children: React.ReactNode }) {
  const idioma = await idiomaActual();
  const es = idioma === "es";

  const secciones: SeccionMenu[] = SECCIONES_DOCS.map((seccion) => ({
    id: seccion.id,
    icono: seccion.icono,
    titulo: seccion.titulo[idioma],
    guias: GUIAS.filter((guia) => guia.seccion === seccion.id).map((guia) => ({
      slug: guia.slug,
      icono: guia.icono,
      titulo: guia.titulo[idioma],
    })),
  }));

  const indice: EntradaIndice[] = GUIAS.map((guia) => ({
    slug: guia.slug,
    icono: guia.icono,
    titulo: guia.titulo[idioma],
    resumen: guia.resumen[idioma],
    seccion: SECCIONES_DOCS.find((s) => s.id === guia.seccion)?.titulo[idioma] ?? "",
    texto: normalizarBusqueda(textoPlano(guia, idioma)),
  }));

  return (
    <div className="bg-crema/40">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:py-10">
        <aside>
          <div className="mb-4 hidden lg:block">
            <BuscadorDocs indice={indice} idioma={idioma} />
          </div>
          <MenuDocs secciones={secciones} idioma={idioma} />
        </aside>
        <div className="min-w-0">
          <div className="mb-4 lg:hidden">
            <BuscadorDocs indice={indice} idioma={idioma} ocultarEnPortada />
          </div>
          {children}
          <p className="mt-10 text-[12px] text-gris">
            {es
              ? "¿No encontraste lo que buscabas? Escríbenos por WhatsApp desde la tienda y te ayudamos."
              : "Didn't find what you were looking for? Message us on WhatsApp from the store and we'll help."}
          </p>
        </div>
      </div>
    </div>
  );
}
