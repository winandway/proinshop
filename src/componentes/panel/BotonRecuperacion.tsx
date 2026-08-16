"use client";

import { useActionState } from "react";
import {
  generarRecuperacion,
  type ResultadoEquipo,
} from "@/app/panel/(dentro)/equipo/acciones";
import { BotonCopiar } from "./BotonCopiar";

/** Genera el enlace para que alguien del equipo estrene contraseña. */
export function BotonRecuperacion({
  usuarioId,
  nombre,
  dominio,
}: {
  usuarioId: number;
  nombre: string;
  dominio: string;
}) {
  const [estado, enviar, enviando] = useActionState<ResultadoEquipo, FormData>(
    generarRecuperacion,
    {},
  );

  const enlace = estado.recuperacion ? `${dominio}/panel/recuperar/${estado.recuperacion}` : null;

  return (
    <div>
      <form action={enviar}>
        <input type="hidden" name="id" value={usuarioId} />
        <button
          type="submit"
          disabled={enviando}
          className="text-[11.5px] font-bold text-gris transition hover:text-rojo disabled:opacity-60"
        >
          {enviando ? "Generando…" : "Restablecer contraseña"}
        </button>
      </form>

      {estado.error && (
        <p role="alert" className="mt-1 text-[11px] font-bold text-rojo">
          {estado.error}
        </p>
      )}

      {enlace && (
        <div className="mt-2 rounded-xl border border-verde bg-verde-suave p-2.5">
          <p className="text-[11.5px] font-extrabold text-[#0b6e3a]">
            Pásale este enlace a {nombre}:
          </p>
          <p className="mt-1 break-all rounded-lg bg-white px-2 py-1.5 font-mono text-[10px]">
            {enlace}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <BotonCopiar
              texto={enlace}
              etiqueta="Copiar"
              className="rounded-lg bg-tinta px-2.5 py-1 text-[10.5px] font-bold text-white"
            />
            <span className="text-[10px] text-[#3d6b52]">Vence en 2 horas</span>
          </div>
        </div>
      )}
    </div>
  );
}
