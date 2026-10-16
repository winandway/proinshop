import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { usuarioActual } from "@/lib/sesion";
import { alternarCategoria, crearCategoria, editarCategoria } from "../acciones";

export const metadata: Metadata = { title: "Categorías", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

export default async function Categorias() {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol === "vendedor") redirect("/panel/inventario");

  const db = await baseDeDatos();
  // Se listan también las ocultas: si no, una categoría escondida no se puede
  // volver a mostrar nunca.
  const categorias = db
    ? (
        await db
          .prepare(
            `SELECT c.id, c.nombre_es, c.nombre_en, c.emoji, c.visible,
                    (SELECT COUNT(*) FROM producto WHERE categoria_id = c.id) AS productos
             FROM categoria c ORDER BY c.visible DESC, c.orden`,
          )
          .all<{
            id: number;
            nombre_es: string;
            nombre_en: string | null;
            emoji: string | null;
            visible: number;
            productos: number;
          }>()
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
          <li key={categoria.id} className="border-b border-linea last:border-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
                <span aria-hidden="true" className="text-lg">
                  {categoria.emoji ?? "📦"}
                </span>
                <span className="flex-1">
                  <span
                    className={`block text-[13.5px] font-bold ${categoria.visible ? "" : "text-gris"}`}
                  >
                    {categoria.nombre_es}
                  </span>
                  <span className="block text-[11px] text-gris">
                    {categoria.productos} productos
                    {categoria.visible ? "" : " · Oculta en la tienda"}
                  </span>
                </span>
                <span className="text-[11.5px] font-bold text-rojo group-open:hidden">Editar</span>
                <span className="hidden text-[11.5px] font-bold text-gris group-open:inline">
                  Cerrar
                </span>
              </summary>

              <div className="space-y-2.5 px-4 pb-4">
                <form action={editarCategoria} className="space-y-2.5">
                  <input type="hidden" name="id" value={categoria.id} />
                  <div className="flex gap-2.5">
                    <div className="w-20">
                      <label
                        htmlFor={`emoji-${categoria.id}`}
                        className="mb-1.5 block text-[12px] font-bold text-gris"
                      >
                        Ícono
                      </label>
                      <input
                        id={`emoji-${categoria.id}`}
                        name="emoji"
                        defaultValue={categoria.emoji ?? "📦"}
                        className={`${CAMPO} text-center`}
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor={`nombre-${categoria.id}`}
                        className="mb-1.5 block text-[12px] font-bold text-gris"
                      >
                        Nombre
                      </label>
                      <input
                        id={`nombre-${categoria.id}`}
                        name="nombre"
                        required
                        defaultValue={categoria.nombre_es}
                        className={CAMPO}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor={`nombre-en-${categoria.id}`}
                      className="mb-1.5 block text-[12px] font-bold text-gris"
                    >
                      Nombre en inglés
                    </label>
                    <input
                      id={`nombre-en-${categoria.id}`}
                      name="nombre_en"
                      defaultValue={categoria.nombre_en ?? ""}
                      placeholder="Category name"
                      className={CAMPO}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-tinta py-3 text-[13px] font-extrabold text-white transition hover:opacity-90"
                  >
                    Guardar
                  </button>
                </form>

                <form action={alternarCategoria}>
                  <input type="hidden" name="id" value={categoria.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border-[1.5px] border-linea py-3 text-[13px] font-bold text-gris transition hover:border-gris2"
                  >
                    {categoria.visible ? "Ocultar en la tienda" : "Mostrar en la tienda"}
                  </button>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>

      <form action={crearCategoria} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-extrabold">Crear nueva categoría</h2>
        <div className="space-y-2.5">
          <input name="nombre" required placeholder="Nombre de la categoría" className={CAMPO} />
          <input name="nombre_en" placeholder="Nombre en inglés" className={CAMPO} />
        </div>
        <button
          type="submit"
          className="mt-3 w-full rounded-xl bg-tinta py-3.5 text-[13.5px] font-extrabold text-white transition hover:opacity-90"
        >
          Crear categoría
        </button>
        <p className="mt-2 text-[11.5px] text-gris2">
          Aparece sola en la tienda cuando tenga al menos un producto publicado.
        </p>
      </form>
    </>
  );
}
