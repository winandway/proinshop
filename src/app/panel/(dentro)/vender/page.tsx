import Link from "next/link";
import type { Metadata } from "next";
import { PantallaVender } from "@/componentes/panel/PantallaVender";
import { datosNegocio, listaClientes, productosParaVender } from "@/lib/negocio";
import { exigir } from "@/lib/sesion";

export const metadata: Metadata = { title: "Registrar venta", robots: { index: false } };

export default async function Vender() {
  await exigir("vender");
  const [productos, clientes, negocio] = await Promise.all([
    productosParaVender(),
    listaClientes(),
    datosNegocio(),
  ]);

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
        <h1 className="flex-1 text-lg font-black tracking-tight">Registrar venta</h1>
        <Link
          href="/panel/clientes#nuevo"
          className="rounded-xl bg-white px-3 py-2 text-[11.5px] font-bold text-gris shadow-sm"
        >
          + Cliente
        </Link>
      </div>

      <PantallaVender
        productos={productos}
        clientes={clientes}
        moneda2={negocio.moneda2}
        tasa2={negocio.tasa2}
      />
    </>
  );
}
