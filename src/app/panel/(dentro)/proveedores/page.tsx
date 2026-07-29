import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { crearProveedor } from "../gastos/acciones";

export const metadata: Metadata = { title: "Proveedores", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

export default async function Proveedores() {
  const db = await baseDeDatos();

  const proveedores = db
    ? (
        await db
          .prepare(
            `SELECT p.id, p.nombre, p.telefono, p.notas,
                    (SELECT COALESCE(SUM(monto), 0) FROM gasto WHERE proveedor_id = p.id) AS comprado
             FROM proveedor p ORDER BY p.nombre LIMIT 200`,
          )
          .all<{
            id: number;
            nombre: string;
            telefono: string | null;
            notas: string | null;
            comprado: number;
          }>()
      ).results
    : [];

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Proveedores</h1>

      {proveedores.length === 0 ? (
        <p className="mb-4 rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          Todavía no hay proveedores.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {proveedores.map((proveedor) => (
            <li
              key={proveedor.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crema text-lg">
                🚚
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold">{proveedor.nombre}</span>
                <span className="block truncate text-[11.5px] text-gris">
                  {proveedor.telefono ?? "sin teléfono"}
                  {proveedor.notas ? ` · ${proveedor.notas}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-[13px] font-black">
                {formatearPrecio(proveedor.comprado)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={crearProveedor} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-extrabold">Agregar proveedor</h2>
        <div className="space-y-2.5">
          <input name="nombre" required placeholder="Nombre del proveedor" className={CAMPO} />
          <input name="telefono" placeholder="Número de contacto" className={CAMPO} />
          <input name="correo" type="email" placeholder="correo@ejemplo.com" className={CAMPO} />
          <input name="notas" placeholder="Qué le compras" className={CAMPO} />
        </div>
        <button
          type="submit"
          className="mt-3 w-full rounded-xl bg-tinta py-3.5 text-[13.5px] font-extrabold text-white transition hover:opacity-90"
        >
          Guardar proveedor
        </button>
      </form>
    </>
  );
}
