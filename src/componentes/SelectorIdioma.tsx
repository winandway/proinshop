"use client";

import { useTransition } from "react";
import { cambiarIdioma } from "@/app/acciones";
import type { Idioma } from "@/lib/tipos";

const OPCIONES: { idioma: Idioma; bandera: string; titulo: string }[] = [
  { idioma: "es", bandera: "🇪🇸", titulo: "Español" },
  { idioma: "en", bandera: "🇺🇸", titulo: "English" },
];

export function SelectorIdioma({ actual }: { actual: Idioma }) {
  const [cambiando, iniciarCambio] = useTransition();

  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-crema p-1" aria-busy={cambiando}>
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.idioma}
          type="button"
          onClick={() => {
            if (opcion.idioma === actual) return;
            iniciarCambio(async () => {
              await cambiarIdioma(opcion.idioma);
            });
          }}
          title={opcion.titulo}
          aria-label={opcion.titulo}
          aria-pressed={opcion.idioma === actual}
          className={`rounded-lg px-2 py-1 text-base leading-none transition ${
            opcion.idioma === actual ? "bg-white shadow-sm" : "opacity-55 hover:opacity-100"
          }`}
        >
          {opcion.bandera}
        </button>
      ))}
    </div>
  );
}
