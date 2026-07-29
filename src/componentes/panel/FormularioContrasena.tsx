"use client";

import { useActionState } from "react";
import { cambiarContrasena, type ResultadoCuenta } from "@/app/panel/(dentro)/cuenta/acciones";

const CAMPOS = [
  { nombre: "actual", etiqueta: "Contraseña actual", autocompletado: "current-password" },
  { nombre: "nueva", etiqueta: "Contraseña nueva", autocompletado: "new-password" },
  { nombre: "repetida", etiqueta: "Repite la nueva", autocompletado: "new-password" },
];

export function FormularioContrasena() {
  const [estado, enviar, enviando] = useActionState<ResultadoCuenta, FormData>(
    cambiarContrasena,
    {},
  );

  return (
    <form action={enviar} className="space-y-3">
      {estado.error && (
        <p
          role="alert"
          className="rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}
      {estado.listo && (
        <p
          role="status"
          className="rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          {estado.listo}
        </p>
      )}

      {CAMPOS.map((campo) => (
        <div key={campo.nombre}>
          <label htmlFor={campo.nombre} className="mb-1.5 block text-[12.5px] font-bold text-gris">
            {campo.etiqueta}
          </label>
          <input
            id={campo.nombre}
            name={campo.nombre}
            type="password"
            required
            autoComplete={campo.autocompletado}
            className="w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition focus:border-rojo"
          />
        </div>
      ))}

      <p className="text-[11.5px] text-gris2">Mínimo 8 caracteres, con letras y números.</p>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-rojo py-3.5 text-[13.5px] font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-60"
      >
        {enviando ? "Cambiando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
