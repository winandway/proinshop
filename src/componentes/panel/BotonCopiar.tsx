"use client";

import { useState } from "react";

/** Copia un texto al portapapeles y avisa. Si el navegador lo bloquea, lo
 *  muestra en un cuadro para copiarlo a mano. */
export function BotonCopiar({
  texto,
  etiqueta = "Copiar",
  className = "",
}: {
  texto: string;
  etiqueta?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        const avisar = () => {
          setCopiado(true);
          window.setTimeout(() => setCopiado(false), 1800);
        };
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(texto).then(avisar, () =>
            window.prompt("Copia el enlace:", texto),
          );
        } else {
          window.prompt("Copia el enlace:", texto);
        }
      }}
      className={className || "text-[11.5px] font-bold text-rojo transition hover:underline"}
    >
      {copiado ? "✓ Copiado" : etiqueta}
    </button>
  );
}
