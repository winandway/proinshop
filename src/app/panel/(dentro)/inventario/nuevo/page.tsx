import Link from "next/link";
import type { Metadata } from "next";
import { FormularioProducto } from "@/componentes/panel/FormularioProducto";
import { baseDeDatos } from "@/lib/d1";
import { crearProducto } from "../acciones";

export const metadata: Metadata = { title: "Crear producto", robots: { index: false } };

export default async function NuevoProducto() {
  const db = await baseDeDatos();
  const categorias = db
    ? (
        await db
          .prepare("SELECT id, nombre_es FROM categoria WHERE visible = 1 ORDER BY orden")
          .all<{ id: number; nombre_es: string }>()
      ).results
    : [];

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/inventario"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Crear producto</h1>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <FormularioProducto
          accion={crearProducto}
          categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre_es }))}
          boton="Crear producto"
        />
      </div>
    </>
  );
}
