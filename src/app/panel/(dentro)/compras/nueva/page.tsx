import Link from "next/link";
import type { Metadata } from "next";
import { FormularioCompra } from "@/componentes/panel/FormularioCompra";
import { listaProveedores, productosParaVender } from "@/lib/negocio";
import { exigir } from "@/lib/sesion";

export const metadata: Metadata = { title: "Registrar compra", robots: { index: false } };

export default async function NuevaCompra() {
  await exigir("compras");
  const [productos, proveedores] = await Promise.all([productosParaVender(), listaProveedores()]);

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/compras"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Registrar compra</h1>
      </div>
      <FormularioCompra productos={productos} proveedores={proveedores} />
    </>
  );
}
