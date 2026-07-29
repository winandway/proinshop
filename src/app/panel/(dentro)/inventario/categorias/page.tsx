import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { crearCategoria } from "../acciones";

export const metadata: Metadata = { title: "Categorías", robots: { index: false } };

export default async function Categorias() {
  const db = await baseDeDatos();
  const categorias = db
    ? (
        await db
          .prepare(
            `SELECT c.id, c.nombre_es, c.emoji,
                    (SELECT COUNT(*) FROM producto WHERE categoria_id = c.id) AS productos
             FROM categoria c WHERE c.visible = 1 ORDER BY c.orden`,
          )
          .all<{ id: number; nombre_es: string; emoji: string | null; productos: number }>()
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
        <h1 className="text-lg font-black tracking-tight">Categorías</h1>
      </div>

      <ul className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="flex items-center gap-3 border-b border-linea px-4 py-3.5 last:border-0"
          >
            <span aria-hidden="true" className="text-lg">
              {categoria.emoji ?? "📦"}
            </span>
            <span className="flex-1 text-[13.5px] font-bold">{categoria.nombre_es}</span>
            <span className="text-[11.5px] text-gris">{categoria.productos} productos</span>
          </li>
        ))}
      </ul>

      <form action={crearCategoria} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-extrabold">Crear nueva categoría</h2>
        <input
          name="nombre"
          required
          placeholder="Nombre de la categoría"
          className="w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo"
        />
        <button
          type="submit"
          className="mt-3 w-full rounded-xl bg-tinta py-3.5 text-[13.5px] font-extrabold text-white transition hover:opacity-90"
        >
          Crear categoría
        </button>
        <p className="mt-2 text-[11.5px] text-gris2">
          Aparece sola en el menú de la tienda cuando tenga productos.
        </p>
      </form>
    </>
  );
}
