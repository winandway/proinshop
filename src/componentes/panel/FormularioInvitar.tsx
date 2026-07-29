"use client";

import { useActionState, useState } from "react";
import { invitar, type ResultadoEquipo } from "@/app/panel/(dentro)/equipo/acciones";

const ROLES = [
  { valor: "dueno", texto: "Propietario", detalle: "Todo: ventas, ganancias, equipo y tienda" },
  { valor: "vendedor", texto: "Vendedor", detalle: "Vende, atiende pedidos y clientes" },
  { valor: "bodega", texto: "Bodega", detalle: "Carga productos y maneja el stock" },
];

export function FormularioInvitar({ dominio }: { dominio: string }) {
  const [estado, enviar, enviando] = useActionState<ResultadoEquipo, FormData>(invitar, {});
  const [copiado, setCopiado] = useState(false);

  const enlace = estado.codigo ? `${dominio}/panel/invitacion?codigo=${estado.codigo}` : null;

  return (
    <div className="rounded-2xl border border-linea bg-white p-4">
      <h2 className="text-[13px] font-extrabold">Invitar a alguien</h2>
      <p className="mb-4 mt-1 text-[12px] text-gris">
        Se crea un enlace. Pásaselo por WhatsApp y esa persona elige su propia
        contraseña — tú nunca la conoces.
      </p>

      <form action={enviar} className="space-y-3">
        {estado.error && (
          <p
            role="alert"
            className="rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
          >
            {estado.error}
          </p>
        )}

        <input
          name="nombre"
          placeholder="Nombre de la persona (opcional)"
          className="w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo"
        />

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-[12.5px] font-bold text-gris">Permisos</legend>
          {ROLES.map((rol, indice) => (
            <label
              key={rol.valor}
              className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-linea p-3 transition has-checked:border-rojo has-checked:bg-rojo-suave"
            >
              <input
                type="radio"
                name="rol"
                value={rol.valor}
                defaultChecked={indice === 1}
                className="mt-0.5 accent-rojo"
              />
              <span>
                <span className="block text-[13px] font-extrabold">{rol.texto}</span>
                <span className="block text-[11.5px] text-gris">{rol.detalle}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-tinta py-3.5 text-[13.5px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Creando el enlace…" : "Crear enlace de invitación"}
        </button>
      </form>

      {enlace && (
        <div className="mt-4 rounded-xl border border-verde bg-verde-suave p-3.5">
          <p className="text-[12.5px] font-extrabold text-[#0b6e3a]">
            Listo. Pásale este enlace:
          </p>
          <p className="mt-2 break-all rounded-lg bg-white px-3 py-2.5 font-mono text-[11.5px]">
            {enlace}
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(enlace).then(
                () => {
                  setCopiado(true);
                  window.setTimeout(() => setCopiado(false), 1800);
                },
                () => window.prompt("Copia el enlace:", enlace),
              );
            }}
            className="mt-2.5 w-full rounded-lg bg-verde py-2.5 text-[12.5px] font-extrabold text-white transition hover:brightness-95"
          >
            {copiado ? "✓ Copiado" : "Copiar enlace"}
          </button>
          <p className="mt-2 text-[11px] text-[#3d6b52]">
            Vence en 7 días y sirve una sola vez.
          </p>
        </div>
      )}
    </div>
  );
}
