"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { normalizarBusqueda } from "@/lib/docs";

export type EntradaIndice = {
  slug: string;
  icono: string;
  titulo: string;
  resumen: string;
  seccion: string;
  /** Todo el texto de la guía, ya sin acentos ni mayúsculas. */
  texto: string;
};

const sinSuscripcion = () => () => {};

/**
 * El buscador de Docs: filtra mientras se escribe, con flechas y Enter para
 * abrir, y con ⌘K (o Ctrl+K) para llegar a él desde cualquier parte.
 */
export function BuscadorDocs({
  indice,
  idioma,
  grande = false,
  ocultarEnPortada = false,
}: {
  indice: EntradaIndice[];
  idioma: "es" | "en";
  grande?: boolean;
  /** En el celular, la portada ya tiene su buscador grande. */
  ocultarEnPortada?: boolean;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const campo = useRef<HTMLInputElement>(null);
  // El menú tiene dos copias (celular y computadora): cada una con su id.
  const idCampo = useId();
  const [consulta, setConsulta] = useState("");
  const [marcado, setMarcado] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const atajo = useSyncExternalStore(
    sinSuscripcion,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => "⌘K",
  );

  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        // Si hay dos buscadores (el grande de la portada y el del menú), manda el
        // grande. Y el que está escondido (el del celular en una computadora) no.
        if (!grande && document.querySelector("[data-buscador-grande]")) return;
        if (!campo.current || campo.current.offsetParent === null) return;
        evento.preventDefault();
        campo.current?.focus();
        campo.current?.select();
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [grande]);

  const resultados = useMemo(() => {
    const palabras = normalizarBusqueda(consulta).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return [];
    return indice
      .map((entrada) => {
        const titulo = normalizarBusqueda(entrada.titulo);
        if (!palabras.every((p) => entrada.texto.includes(p) || titulo.includes(p))) return null;
        // Lo que coincide en el título va primero.
        const puntos = palabras.reduce((suma, p) => suma + (titulo.includes(p) ? 3 : 1), 0);
        return { entrada, puntos };
      })
      .filter((fila): fila is NonNullable<typeof fila> => fila !== null)
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 8)
      .map((fila) => fila.entrada);
  }, [consulta, indice]);

  const es = idioma === "es";
  const mostrar = abierto && consulta.trim().length > 0;
  if (ocultarEnPortada && ruta === "/docs") return null;

  return (
    <div className="relative" data-buscador-grande={grande ? "" : undefined}>
      <label className="sr-only" htmlFor={grande ? "buscar-docs-grande" : idCampo}>
        {es ? "Buscar en Docs" : "Search Docs"}
      </label>
      <div
        className={`flex items-center gap-2 rounded-2xl border-[1.5px] border-linea bg-white transition focus-within:border-rojo ${
          grande ? "px-5 py-4 shadow-sm" : "px-3 py-2"
        }`}
      >
        <span aria-hidden="true" className={grande ? "text-xl" : "text-sm"}>
          🔍
        </span>
        <input
          ref={campo}
          id={grande ? "buscar-docs-grande" : idCampo}
          type="search"
          value={consulta}
          autoComplete="off"
          onChange={(evento) => {
            setConsulta(evento.target.value);
            setMarcado(0);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
          onKeyDown={(evento) => {
            if (evento.key === "ArrowDown") {
              evento.preventDefault();
              setMarcado((valor) => Math.min(valor + 1, Math.max(resultados.length - 1, 0)));
            } else if (evento.key === "ArrowUp") {
              evento.preventDefault();
              setMarcado((valor) => Math.max(valor - 1, 0));
            } else if (evento.key === "Enter" && resultados[marcado]) {
              evento.preventDefault();
              setAbierto(false);
              router.push(`/docs/${resultados[marcado].slug}`);
            } else if (evento.key === "Escape") {
              setConsulta("");
              campo.current?.blur();
            }
          }}
          placeholder={
            grande
              ? es
                ? "¿Qué quieres hacer? Ej.: cerrar caja, vender sin señal…"
                : "What do you want to do? E.g. close the register, sell offline…"
              : es
                ? "Buscar…"
                : "Search…"
          }
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-gris2 ${
            grande ? "text-[16px]" : "text-[13px]"
          }`}
        />
        <kbd
          aria-hidden="true"
          className="hidden shrink-0 rounded-md border border-linea px-1.5 py-0.5 text-[10.5px] font-bold text-gris sm:inline"
        >
          {atajo}
        </kbd>
      </div>

      {mostrar && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-linea bg-white shadow-[0_10px_30px_rgba(16,20,30,0.12)]"
        >
          {resultados.length === 0 ? (
            <li className="px-4 py-3 text-[13px] text-gris">
              {es ? "No encontramos nada con eso. Prueba otra palabra." : "Nothing found. Try another word."}
            </li>
          ) : (
            resultados.map((entrada, posicion) => (
              <li key={entrada.slug} role="option" aria-selected={posicion === marcado}>
                <Link
                  href={`/docs/${entrada.slug}`}
                  onMouseEnter={() => setMarcado(posicion)}
                  className={`flex items-start gap-3 px-4 py-3 transition ${
                    posicion === marcado ? "bg-rojo-suave" : ""
                  }`}
                >
                  <span aria-hidden="true" className="text-lg">
                    {entrada.icono}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-extrabold text-tinta">{entrada.titulo}</span>
                    <span className="block truncate text-[12px] text-gris">
                      {entrada.seccion} · {entrada.resumen}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
