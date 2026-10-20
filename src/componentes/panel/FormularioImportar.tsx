"use client";

import { useActionState, useState } from "react";
import { enviarSinBorrar } from "@/componentes/enviar-sin-borrar";
import {
  importarProductos,
  type ResultadoImportar,
} from "@/app/panel/(dentro)/inventario/importar/acciones";

export function FormularioImportar() {
  const [estado, enviar, enviando] = useActionState<ResultadoImportar, FormData>(importarProductos, {});
  const [archivo, setArchivo] = useState<string | null>(null);

  return (
    <form onSubmit={enviarSinBorrar(enviar)} className="rounded-2xl bg-white p-4 shadow-sm">
      {estado.error && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}
      <label className="block cursor-pointer rounded-2xl border-[1.5px] border-dashed border-linea bg-crema p-6 text-center">
        <input
          type="file"
          name="archivo"
          accept=".csv,text/csv,.txt"
          className="hidden"
          onChange={(e) => setArchivo(e.currentTarget.files?.[0]?.name ?? null)}
        />
        <span aria-hidden="true" className="block text-3xl">
          📥
        </span>
        <span className="mt-2 block text-[13px] font-extrabold">{archivo ?? "Elegir el archivo CSV"}</span>
        <span className="block text-[11.5px] text-gris">Excel → Guardar como → CSV UTF-8</span>
      </label>
      <button
        type="submit"
        disabled={enviando || !archivo}
        className="mt-3 w-full rounded-2xl bg-rojo py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-50"
      >
        {enviando ? "Cargando…" : "Cargar productos"}
      </button>
    </form>
  );
}
