"use client";

import { useState } from "react";

/**
 * Campo de contraseña con el ojito para verla.
 *
 * Escribir una contraseña a ciegas es de las cosas que más frustran: uno pega
 * la clave guardada, no puede comprobar si es la correcta y se termina
 * bloqueando la cuenta. Arranca oculta, porque puede haber alguien detrás.
 *
 * Todo campo de contraseña del sistema usa esta pieza; no debe quedar ningún
 * `<input type="password">` suelto.
 */
export function CampoClave({
  id,
  name,
  etiqueta,
  ayuda,
  autoComplete = "current-password",
  required = true,
}: {
  id: string;
  name: string;
  etiqueta: string;
  ayuda?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-bold text-gris">
        {etiqueta}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          className="w-full rounded-xl border-[1.5px] border-linea py-3.5 pl-4 pr-12 text-sm font-semibold text-tinta outline-none transition focus:border-rojo"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar la contraseña" : "Ver la contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-lg text-gris transition hover:text-tinta"
        >
          <span aria-hidden="true">{visible ? "🙈" : "👁"}</span>
        </button>
      </div>

      {ayuda && <p className="mt-1.5 text-[11.5px] text-gris2">{ayuda}</p>}
    </div>
  );
}
