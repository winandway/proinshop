import Link from "next/link";
import type { Metadata } from "next";
import { PantallaVender } from "@/componentes/panel/PantallaVender";
import { listaClientes, productosParaVender } from "@/lib/negocio";

export const metadata: Metadata = { title: "Registrar venta", robots: { index: false } };

export default async function Vender() {
  const [productos, clientes] = await Promise.all([productosParaVender(), listaClientes()]);

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
        <h1 className="text-lg font-black tracking-tight">Registrar venta</h1>
      </div>

      <PantallaVender productos={productos} clientes={clientes} />
    </>
  );
}
