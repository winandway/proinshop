"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Borrar los productos marcados. Como toda acción sin vuelta atrás, vive
 * detrás de los tres puntos y pide confirmación diciendo cuántos son.
 * Va dentro del formulario de la edición masiva: usa sus casillas.
 */
export function BorrarMarcados({ accion }: { accion: (datos: FormData) => Promise<void> }) {
  const [abierto, setAbierto] = useState(false);
  const [cuantos, setCuantos] = useState(0);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alTocarFuera = (evento: MouseEvent) => {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alTeclear = (evento: KeyboardEvent) => evento.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alTocarFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alTocarFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  function abrir() {
    const formulario = caja.current?.closest("form");
    setCuantos(formulario ? formulario.querySelectorAll('input[name="ids"]:checked').length : 0);
    setAbierto((valor) => !valor);
  }

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-label="Más opciones"
        aria-expanded={abierto}
        onClick={abrir}
        className="grid h-[50px] w-12 place-items-center rounded-2xl border-[1.5px] border-linea bg-white text-lg font-black text-gris"
      >
        ⋮
      </button>
      {abierto && (
        <div className="absolute bottom-14 right-0 z-50 w-72 rounded-2xl border border-linea bg-white p-3 shadow-[0_8px_30px_rgba(16,20,30,0.14)]">
          {cuantos === 0 ? (
            <p className="text-[12.5px] text-gris">Marca primero los productos que quieres borrar.</p>
          ) : (
            <>
              <p className="text-[13px] font-extrabold">
                ¿Borrar {cuantos === 1 ? "el producto marcado" : `los ${cuantos} productos marcados`}?
              </p>
              <p className="mt-1 text-[11.5px] leading-snug text-gris">
                Desaparecen del inventario y de la tienda. Las ventas y pedidos viejos se conservan con
                su nombre. No se puede deshacer.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="flex-1 rounded-xl border-[1.5px] border-linea py-2.5 text-[12px] font-bold text-gris"
                >
                  No
                </button>
                <button
                  type="submit"
                  formAction={accion}
                  formNoValidate
                  className="flex-1 rounded-xl bg-rojo py-2.5 text-[12px] font-extrabold text-white transition hover:bg-rojo-oscuro"
                >
                  🗑 Sí, borrar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
