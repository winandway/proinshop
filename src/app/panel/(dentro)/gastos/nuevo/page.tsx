import Link from "next/link";
import type { Metadata } from "next";
import { FormularioGasto } from "@/componentes/panel/FormularioGasto";
import { listaProveedores } from "@/lib/negocio";

export const metadata: Metadata = { title: "Registrar gasto", robots: { index: false } };

export default async function NuevoGasto() {
  const proveedores = await listaProveedores();

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Registrar gasto</h1>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <FormularioGasto proveedores={proveedores} />
      </div>
    </>
  );
}
