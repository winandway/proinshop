"use client";

import { useActionState } from "react";
import type { Resultado } from "@/app/panel/acciones";

type Campo = {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  marcador?: string;
  ayuda?: string;
  valor?: string;
  soloLectura?: boolean;
};

/**
 * Formulario de entrada, alta de propietario e invitación. Los tres tienen la
 * misma forma, así que comparten componente: una sola manera de mostrar el
 * error y el estado "enviando".
 */
export function FormularioAcceso({
  accion,
  campos,
  boton,
  botonEnviando,
}: {
  accion: (previo: Resultado, datos: FormData) => Promise<Resultado>;
  campos: Campo[];
  boton: string;
  botonEnviando: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, {});

  return (
    <form action={enviar} className="space-y-4">
      {estado.error && (
        <p
          role="alert"
          className="rounded-xl border border-rojo bg-rojo-suave px-4 py-3 text-[13px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}

      {campos.map((campo) => (
        <div key={campo.nombre}>
          <label
            htmlFor={campo.nombre}
            className="mb-1.5 block text-[12.5px] font-bold text-gris"
          >
            {campo.etiqueta}
          </label>
          <input
            id={campo.nombre}
            name={campo.nombre}
            type={campo.tipo ?? "text"}
            defaultValue={campo.valor}
            readOnly={campo.soloLectura}
            placeholder={campo.marcador}
            required
            autoComplete={
              campo.tipo === "password"
                ? campo.nombre === "contrasena"
                  ? "new-password"
                  : "off"
                : campo.tipo === "email"
                  ? "email"
                  : "off"
            }
            className={`w-full rounded-xl border-[1.5px] border-linea px-4 py-3.5 text-sm font-semibold text-tinta outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo ${
              campo.soloLectura ? "bg-crema text-gris" : ""
            }`}
          />
          {campo.ayuda && <p className="mt-1.5 text-[11.5px] text-gris2">{campo.ayuda}</p>}
        </div>
      ))}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-60"
      >
        {enviando ? botonEnviando : boton}
      </button>
    </form>
  );
}
