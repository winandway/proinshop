import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { idiomaActual } from "@/lib/idioma-servidor";
import { GUIAS, SECCIONES_DOCS, guiaPorSlug, type Bloque } from "@/lib/docs";

export function generateStaticParams() {
  return GUIAS.map((guia) => ({ guia: guia.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guia: string }>;
}): Promise<Metadata> {
  const guia = guiaPorSlug((await params).guia);
  if (!guia) return {};
  const idioma = await idiomaActual();
  return {
    title: `${guia.titulo[idioma]} · Docs`,
    description: guia.resumen[idioma],
    alternates: { canonical: `/docs/${guia.slug}` },
    openGraph: { title: guia.titulo[idioma], description: guia.resumen[idioma] },
  };
}

function Contenido({ bloque, idioma }: { bloque: Bloque; idioma: "es" | "en" }) {
  switch (bloque.tipo) {
    case "parrafo":
      return <p className="text-[15px] leading-relaxed text-tinta/90">{bloque.texto[idioma]}</p>;
    case "subtitulo":
      return <h2 className="pt-3 text-[18px] font-black tracking-tight">{bloque.texto[idioma]}</h2>;
    case "pasos":
      return (
        <ol className="space-y-2.5">
          {bloque.pasos.map((paso, posicion) => (
            <li key={posicion} className="flex gap-3 text-[15px] leading-relaxed">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rojo text-[12px] font-black text-white"
              >
                {posicion + 1}
              </span>
              <span>{paso[idioma]}</span>
            </li>
          ))}
        </ol>
      );
    case "lista":
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed marker:text-rojo">
          {bloque.puntos.map((punto, posicion) => (
            <li key={posicion}>{punto[idioma]}</li>
          ))}
        </ul>
      );
    case "nota":
      return (
        <p className="rounded-2xl border-l-4 border-rojo bg-rojo-suave/60 px-4 py-3 text-[14px] leading-relaxed">
          <b>{idioma === "es" ? "Bueno saber: " : "Good to know: "}</b>
          {bloque.texto[idioma]}
        </p>
      );
    case "captura":
      return (
        <figure className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-linea bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- captura fija de public/capturas */}
          <img src={`/capturas/${bloque.archivo}`} alt={bloque.alt[idioma]} loading="lazy" className="w-full" />
          <figcaption className="border-t border-linea px-4 py-2 text-center text-[12px] text-gris">
            {bloque.alt[idioma]}
          </figcaption>
        </figure>
      );
  }
}

export default async function PaginaGuia({ params }: { params: Promise<{ guia: string }> }) {
  const guia = guiaPorSlug((await params).guia);
  if (!guia) notFound();
  const idioma = await idiomaActual();
  const es = idioma === "es";
  const seccion = SECCIONES_DOCS.find((s) => s.id === guia.seccion);
  const relacionadas = (guia.relacionadas ?? [])
    .map((slug) => guiaPorSlug(slug))
    .filter((otra): otra is NonNullable<typeof otra> => Boolean(otra));

  return (
    <article className="rounded-3xl bg-white p-5 shadow-[0_2px_20px_rgba(16,20,30,0.05)] sm:p-8">
      <nav aria-label={es ? "Ruta" : "Breadcrumb"} className="mb-4 flex items-center gap-1.5 text-[12.5px] text-gris">
        <Link href="/docs" className="font-bold text-rojo hover:underline">
          ← Docs
        </Link>
        {seccion && (
          <>
            <span aria-hidden="true">/</span>
            <span>{seccion.titulo[idioma]}</span>
          </>
        )}
      </nav>

      <header className="mb-6 border-b border-linea pb-5">
        <p aria-hidden="true" className="text-3xl">
          {guia.icono}
        </p>
        <h1 className="mt-2 text-[26px] font-black leading-tight tracking-tight sm:text-3xl">{guia.titulo[idioma]}</h1>
        <p className="mt-2 text-[15px] text-gris">{guia.resumen[idioma]}</p>
      </header>

      <div className="space-y-4">
        {guia.bloques.map((bloque, posicion) => (
          <Contenido key={posicion} bloque={bloque} idioma={idioma} />
        ))}
      </div>

      {relacionadas.length > 0 && (
        <aside className="mt-10 border-t border-linea pt-5">
          <h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-gris">
            {es ? "Sigue leyendo" : "Keep reading"}
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {relacionadas.map((otra) => (
              <Link
                key={otra.slug}
                href={`/docs/${otra.slug}`}
                className="flex items-center gap-2.5 rounded-2xl border border-linea px-4 py-3 text-[13.5px] font-bold transition hover:border-rojo/40 hover:bg-crema"
              >
                <span aria-hidden="true">{otra.icono}</span>
                {otra.titulo[idioma]}
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
