"use client";

import { useActionState, useState } from "react";
import { registrarGasto, type ResultadoGasto } from "@/app/panel/(dentro)/gastos/acciones";
import { CATEGORIAS_GASTO, METODOS_PAGO, type ClienteSimple } from "@/lib/negocio";

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

export function FormularioGasto({ proveedores }: { proveedores: ClienteSimple[] }) {
  const [estado, enviar, enviando] = useActionState<ResultadoGasto, FormData>(registrarGasto, {});
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_GASTO[0]);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [recibo, setRecibo] = useState<string | null>(null);

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="categoria" value={categoria} />
      <input type="hidden" name="metodo_pago" value={metodoPago} />

      {estado.error && (
        <p
          role="alert"
          className="rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}

      <div className="rounded-2xl bg-crema p-5 text-center">
        <label htmlFor="monto" className="block text-[12px] font-bold text-gris">
          Monto del gasto
        </label>
        <input
          id="monto"
          name="monto"
          required
          inputMode="decimal"
          placeholder="$ 0"
          className="mt-1 w-full bg-transparent text-center text-3xl font-black tracking-tight outline-none placeholder:text-gris2"
        />
      </div>

      <div>
        <p className="mb-2 text-[12.5px] font-bold text-gris">Categoría</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_GASTO.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setCategoria(opcion)}
              aria-pressed={categoria === opcion}
              className={`rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition ${
                categoria === opcion
                  ? "border-tinta bg-tinta text-white"
                  : "border-linea bg-white text-gris"
              }`}
            >
              {opcion}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="proveedor_id" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Proveedor
        </label>
        <select id="proveedor_id" name="proveedor_id" defaultValue="" className={CAMPO}>
          <option value="">Sin proveedor</option>
          {proveedores.map((proveedor) => (
            <option key={proveedor.id} value={proveedor.id}>
              {proveedor.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-[12.5px] font-bold text-gris">Método de pago</p>
        <div className="flex flex-wrap gap-2">
          {METODOS_PAGO.filter((m) => m.valor !== "fiado").map((metodo) => (
            <button
              key={metodo.valor}
              type="button"
              onClick={() => setMetodoPago(metodo.valor)}
              aria-pressed={metodoPago === metodo.valor}
              className={`rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition ${
                metodoPago === metodo.valor
                  ? "border-tinta bg-tinta text-white"
                  : "border-linea bg-white text-gris"
              }`}
            >
              {metodo.texto}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="nota" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Nota (opcional)
        </label>
        <input id="nota" name="nota" placeholder="Describe el gasto" className={CAMPO} />
      </div>

      <label className="block cursor-pointer rounded-2xl border-[1.5px] border-dashed border-linea bg-white p-5 text-center">
        <input
          type="file"
          name="recibo"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(evento) => setRecibo(evento.target.files?.[0]?.name ?? null)}
        />
        <span aria-hidden="true" className="block text-2xl">
          📷
        </span>
        <span className="mt-1.5 block text-[12.5px] font-extrabold">
          {recibo ?? "Adjuntar foto del recibo"}
        </span>
        <span className="block text-[11px] text-gris">Queda guardada con el gasto</span>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-60"
      >
        {enviando ? "Registrando…" : "Registrar gasto"}
      </button>
    </form>
  );
}
