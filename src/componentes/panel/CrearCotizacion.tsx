"use client";

import { useActionState, useState } from "react";
import {
  crearCotizacion,
  type ResultadoCotizacion,
} from "@/app/panel/(dentro)/cotizaciones/acciones";
import { formatearPrecio } from "@/lib/i18n";
import type { ClienteSimple, ProductoVenta } from "@/lib/negocio";
import { BotonCopiar } from "./BotonCopiar";

export function CrearCotizacion({
  productos,
  clientes,
  dominio,
}: {
  productos: ProductoVenta[];
  clientes: ClienteSimple[];
  dominio: string;
}) {
  const [estado, enviar, enviando] = useActionState<ResultadoCotizacion, FormData>(
    crearCotizacion,
    {},
  );
  const [lineas, setLineas] = useState<Record<number, number>>({});
  const [clienteId, setClienteId] = useState("");

  const elegidos = productos.filter((p) => (lineas[p.id] ?? 0) > 0);
  const total = elegidos.reduce((suma, p) => suma + p.precio * lineas[p.id], 0);
  const enlace = estado.token ? `${dominio}/cotizacion/${estado.token}` : null;

  return (
    <form action={enviar} className="rounded-2xl bg-white p-4 shadow-sm">
      <input
        type="hidden"
        name="lineas"
        value={JSON.stringify(elegidos.map((p) => ({ productoId: p.id, cantidad: lineas[p.id] })))}
      />
      <input type="hidden" name="cliente_id" value={clienteId} />

      <h2 className="mb-3 text-[13px] font-extrabold">Nueva cotización</h2>

      {estado.error && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}

      {enlace && (
        <div className="mb-3 rounded-xl border border-verde bg-verde-suave p-3">
          <p className="text-[12.5px] font-extrabold text-[#0b6e3a]">
            Cotización creada. Pásale este enlace:
          </p>
          <p className="mt-1.5 break-all rounded-lg bg-white px-2.5 py-2 font-mono text-[10.5px]">
            {enlace}
          </p>
          <div className="mt-2 flex gap-3">
            <BotonCopiar
              texto={enlace}
              etiqueta="Copiar"
              className="rounded-lg bg-tinta px-3 py-1.5 text-[11.5px] font-bold text-white"
            />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Tu cotización de Proinshop: ${enlace}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11.5px] font-bold text-verde hover:underline"
            >
              Enviar por WhatsApp
            </a>
          </div>
        </div>
      )}

      <select
        value={clienteId}
        onChange={(evento) => setClienteId(evento.target.value)}
        className="mb-3 w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none"
      >
        <option value="">Cliente (opcional)</option>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nombre}
          </option>
        ))}
      </select>

      <ul className="mb-3 max-h-72 space-y-1.5 overflow-y-auto">
        {productos.slice(0, 30).map((producto) => (
          <li key={producto.id} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="min-w-0 flex-1 truncate">{producto.nombre_es}</span>
            <span className="shrink-0 text-gris">{formatearPrecio(producto.precio)}</span>
            <span className="flex shrink-0 items-center gap-1 rounded-lg border border-linea p-0.5">
              <button
                type="button"
                aria-label="Quitar uno"
                onClick={() =>
                  setLineas((a) => {
                    const n = Math.max(0, (a[producto.id] ?? 0) - 1);
                    const copia = { ...a };
                    if (n === 0) delete copia[producto.id];
                    else copia[producto.id] = n;
                    return copia;
                  })
                }
                className="grid h-6 w-6 place-items-center font-bold text-gris"
              >
                −
              </button>
              <span className="w-5 text-center font-extrabold">{lineas[producto.id] ?? 0}</span>
              <button
                type="button"
                aria-label="Agregar uno"
                onClick={() =>
                  setLineas((a) => ({ ...a, [producto.id]: (a[producto.id] ?? 0) + 1 }))
                }
                className="grid h-6 w-6 place-items-center font-bold text-gris"
              >
                +
              </button>
            </span>
          </li>
        ))}
      </ul>

      <button
        type="submit"
        disabled={enviando || elegidos.length === 0}
        className="w-full rounded-xl bg-rojo py-3.5 text-[13.5px] font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-50"
      >
        {enviando ? "Creando…" : `Crear cotización · ${formatearPrecio(total)}`}
      </button>
    </form>
  );
}
