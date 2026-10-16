"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Las acciones que no tienen vuelta atrás (eliminar, cancelar) nunca van a la
 * vista: viven aquí, detrás de los tres puntos, y además piden confirmación.
 * Un botón rojo suelto se toca sin querer.
 */
export function MenuTresPuntos({
  etiqueta,
  pregunta,
  detalle,
  confirmar,
  accion,
  campos,
}: {
  etiqueta: string;
  pregunta: string;
  detalle: string;
  confirmar: string;
  accion: (datos: FormData) => Promise<void>;
  campos: Record<string, string | number>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [preguntando, setPreguntando] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function cerrar() {
      setAbierto(false);
      setPreguntando(false);
    }
    function alTocarFuera(evento: MouseEvent) {
      if (!caja.current?.contains(evento.target as Node)) cerrar();
    }
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === "Escape") cerrar();
    }

    document.addEventListener("mousedown", alTocarFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alTocarFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-label="Más opciones"
        aria-expanded={abierto}
        onClick={() => {
          setAbierto((valor) => !valor);
          setPreguntando(false);
        }}
        className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg font-black text-gris shadow-sm transition hover:text-tinta"
      >
        ⋮
      </button>

      {abierto && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-linea bg-white p-2 shadow-[0_8px_30px_rgba(16,20,30,0.14)]">
          {!preguntando ? (
            <button
              type="button"
              onClick={() => setPreguntando(true)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-rojo-oscuro transition hover:bg-rojo-suave"
            >
              <span aria-hidden="true">🗑</span>
              {etiqueta}
            </button>
          ) : (
            <form action={accion} className="p-2">
              {Object.entries(campos).map(([nombre, valor]) => (
                <input key={nombre} type="hidden" name={nombre} value={valor} />
              ))}
              <p className="text-[13px] font-extrabold">{pregunta}</p>
              <p className="mt-1 text-[11.5px] leading-snug text-gris">{detalle}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreguntando(false);
                    setAbierto(false);
                  }}
                  className="flex-1 rounded-xl border-[1.5px] border-linea py-2.5 text-[12px] font-bold text-gris"
                >
                  No
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-rojo py-2.5 text-[12px] font-extrabold text-white transition hover:bg-rojo-oscuro"
                >
                  {confirmar}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
