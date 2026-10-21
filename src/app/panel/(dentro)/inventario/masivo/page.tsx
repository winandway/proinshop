import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { SeleccionarTodos } from "@/componentes/panel/SeleccionarTodos";
import { exigir } from "@/lib/sesion";
import { BorrarMarcados } from "@/componentes/panel/BorrarMarcados";
import { MAXIMO_A_LA_VEZ } from "@/lib/borrar-productos";
import { aplicarMasivo, eliminarSeleccionados } from "./acciones";

export const metadata: Metadata = { title: "Edición masiva", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[13px] font-semibold outline-none focus:border-rojo";

export default async function Masivo({
  searchParams,
}: {
  searchParams: Promise<{ nada?: string; muchos?: string }>;
}) {
  const usuario = await exigir("inventario");
  const esDueno = usuario.rol === "dueno";
  const { nada, muchos } = await searchParams;
  const db = await baseDeDatos();
  const [productos, categorias] = db
    ? await Promise.all([
        db
          .prepare(
            `SELECT p.id, p.nombre_es, p.precio, p.stock, p.publicado, c.nombre_es AS categoria
             FROM producto p LEFT JOIN categoria c ON c.id = p.categoria_id ORDER BY c.orden, p.nombre_es`,
          )
          .all<{ id: number; nombre_es: string; precio: number; stock: number; publicado: number; categoria: string | null }>()
          .then((r) => r.results),
        db
          .prepare("SELECT id, nombre_es FROM categoria ORDER BY visible DESC, orden")
          .all<{ id: number; nombre_es: string }>()
          .then((r) => r.results),
      ])
    : [[], []];

  return (
    <form action={aplicarMasivo} className="pb-60">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/inventario"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Edición masiva</h1>
      </div>

      {nada && (
        <p role="alert" className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro">
          Marca al menos un producto y elige qué cambiarle.
        </p>
      )}
      {muchos && (
        <p role="alert" className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro">
          Se pueden borrar hasta {MAXIMO_A_LA_VEZ} productos a la vez. Marca menos y repite.
        </p>
      )}

      <div className="mb-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <SeleccionarTodos />
        <span className="text-[11.5px] text-gris">{productos.length} productos</span>
      </div>

      <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {productos.map((producto) => (
          <li key={producto.id} className="border-b border-linea last:border-0">
            <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
              <input type="checkbox" name="ids" value={producto.id} className="h-4 w-4 accent-rojo" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{producto.nombre_es}</span>
                <span className="block text-[11px] text-gris">
                  {producto.categoria ?? "Sin categoría"} · {producto.stock} en stock ·{" "}
                  {producto.publicado ? "en la tienda" : "sin publicar"}
                </span>
              </span>
              <span className="text-[12.5px] font-black">{formatearPrecio(producto.precio)}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-[74px] z-30 space-y-2 border-t border-linea bg-white p-3.5 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-14rem)] md:max-w-3xl">
        <select name="accion" required defaultValue="" aria-label="Qué cambiar" className={CAMPO}>
          <option value="" disabled>
            ¿Qué les cambias a los marcados?
          </option>
          <option value="precio">Subir o bajar el precio (%)</option>
          <option value="categoria">Cambiar la categoría</option>
          <option value="publicar">Publicar en la tienda</option>
          <option value="ocultar">Quitar de la tienda</option>
          <option value="destacar">Destacar en la portada</option>
          <option value="quitar_destacado">Quitar de destacados</option>
          <option value="minimo">Cambiar el aviso de stock</option>
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input name="porcentaje" inputMode="decimal" placeholder="% (ej. 10 o -5)" aria-label="Porcentaje" className={CAMPO} />
          <select name="categoria_id" defaultValue="" aria-label="Categoría nueva" className={CAMPO}>
            <option value="">Categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_es}
              </option>
            ))}
          </select>
          <input name="minimo" inputMode="numeric" placeholder="Aviso en" aria-label="Avisar cuando queden" className={CAMPO} />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-rojo py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
          >
            Aplicar a los marcados
          </button>
          {esDueno && <BorrarMarcados accion={eliminarSeleccionados} />}
        </div>
      </div>
    </form>
  );
}
