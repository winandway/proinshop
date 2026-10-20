"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SeccionMenu = {
  id: string;
  icono: string;
  titulo: string;
  guias: { slug: string; icono: string; titulo: string }[];
};

/**
 * La barra de Docs. Nunca se pierde: está en todas las páginas de Docs y
 * marca la guía abierta. En el celular va plegada arriba del contenido.
 */
export function MenuDocs({ secciones, idioma }: { secciones: SeccionMenu[]; idioma: "es" | "en" }) {
  const ruta = usePathname();
  const es = idioma === "es";

  const lista = (
    <nav aria-label={es ? "Guías" : "Guides"} className="space-y-5">
      <Link
        href="/docs"
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-extrabold transition ${
          ruta === "/docs" ? "bg-rojo text-white" : "text-tinta hover:bg-crema"
        }`}
      >
        <span aria-hidden="true">📖</span> {es ? "Inicio de Docs" : "Docs home"}
      </Link>
      {secciones.map((seccion) => (
        <div key={seccion.id}>
          <p className="mb-1.5 flex items-center gap-2 px-3 text-[11.5px] font-extrabold uppercase tracking-wide text-gris">
            <span aria-hidden="true">{seccion.icono}</span>
            {seccion.titulo}
          </p>
          <ul className="space-y-0.5">
            {seccion.guias.map((guia) => {
              const activa = ruta === `/docs/${guia.slug}`;
              return (
                <li key={guia.slug}>
                  <Link
                    href={`/docs/${guia.slug}`}
                    aria-current={activa ? "page" : undefined}
                    className={`block rounded-xl px-3 py-1.5 text-[13px] transition ${
                      activa
                        ? "bg-rojo-suave font-extrabold text-rojo-oscuro"
                        : "text-tinta hover:bg-crema"
                    }`}
                  >
                    {guia.titulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Celular: plegada, para que el contenido se vea primero. */}
      <details className="mb-4 rounded-2xl border border-linea bg-white lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-extrabold">
          ☰ {es ? "Todas las guías" : "All guides"}
        </summary>
        <div className="border-t border-linea p-2">{lista}</div>
      </details>
      {/* Computadora: fija a la izquierda. */}
      <div className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-y-auto pb-6 lg:block">{lista}</div>
    </>
  );
}
