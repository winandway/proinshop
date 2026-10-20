"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cambiarIdioma } from "@/app/acciones";
import type { Idioma } from "@/lib/tipos";

/**
 * Selector de idioma estilo Amazon (regla de la casa): un botón con la
 * bandera, el código y una flechita; al tocarlo, una ventanita blanca con un
 * piquito que apunta al botón, el título «Cambiar idioma» y las opciones con
 * su círculo de selección. Se cierra al elegir, al tocar fuera o con Escape.
 *
 * El español va con la bandera de España y el inglés con la de Estados Unidos.
 */
const OPCIONES: { idioma: Idioma; bandera: string; texto: string }[] = [
  { idioma: "en", bandera: "🇺🇸", texto: "English - EN" },
  { idioma: "es", bandera: "🇪🇸", texto: "español - ES" },
];

export function SelectorIdioma({ actual }: { actual: Idioma }) {
  const [abierto, setAbierto] = useState(false);
  const [cambiando, iniciarCambio] = useTransition();
  const caja = useRef<HTMLDivElement>(null);
  const elegido = OPCIONES.find((o) => o.idioma === actual) ?? OPCIONES[1]!;

  useEffect(() => {
    if (!abierto) return;
    const alTocarFuera = (evento: MouseEvent) => {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alTocarFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alTocarFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  function elegir(idioma: Idioma) {
    setAbierto(false);
    if (idioma === actual) return;
    iniciarCambio(async () => {
      await cambiarIdioma(idioma);
    });
  }

  return (
    <div ref={caja} className="relative" aria-busy={cambiando}>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={actual === "es" ? "Cambiar idioma" : "Change language"}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-extrabold transition ${
          abierto ? "border-tinta" : "border-transparent hover:border-tinta"
        }`}
      >
        <span aria-hidden="true" className="text-base leading-none">
          {elegido.bandera}
        </span>
        {elegido.idioma.toUpperCase()}
        <span aria-hidden="true" className="text-[10px]">
          ▾
        </span>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label={actual === "es" ? "Cambiar idioma" : "Change language"}
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 rounded-xl border border-linea bg-white p-3 shadow-[0_8px_24px_rgba(16,20,30,0.12)]"
        >
          {/* El piquito que apunta al botón. */}
          <span
            aria-hidden="true"
            className="absolute -top-[7px] right-6 h-3 w-3 rotate-45 border-l border-t border-linea bg-white"
          />
          <p className="mb-2 text-[13px] font-extrabold text-tinta">
            {actual === "es" ? "Cambiar idioma" : "Change language"}
          </p>
          <ul>
            {OPCIONES.map((opcion) => (
              <li key={opcion.idioma} className="border-t border-linea first:border-t-0">
                <label className="flex cursor-pointer items-center gap-2.5 py-2.5 text-[13px] text-tinta">
                  <input
                    type="radio"
                    name="idioma"
                    checked={opcion.idioma === actual}
                    onChange={() => elegir(opcion.idioma)}
                    className="h-4 w-4 accent-[#e77600]"
                  />
                  <span aria-hidden="true" className="text-base leading-none">
                    {opcion.bandera}
                  </span>
                  {opcion.texto}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
