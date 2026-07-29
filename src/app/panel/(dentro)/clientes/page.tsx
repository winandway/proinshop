import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { crearCliente } from "../vender/acciones";

export const metadata: Metadata = { title: "Clientes", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

export default async function Clientes() {
  const db = await baseDeDatos();

  const clientes = db
    ? (
        await db
          .prepare(
            `SELECT c.id, c.nombre, c.telefono,
                    (SELECT COUNT(*) FROM venta WHERE cliente_id = c.id) AS compras,
                    (SELECT COALESCE(SUM(total), 0) FROM venta WHERE cliente_id = c.id) AS gastado,
                    (SELECT COALESCE(SUM(saldo), 0) FROM deuda WHERE cliente_id = c.id) AS debe
             FROM cliente c ORDER BY c.nombre LIMIT 200`,
          )
          .all<{
            id: number;
            nombre: string;
            telefono: string | null;
            compras: number;
            gastado: number;
            debe: number;
          }>()
      ).results
    : [];

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Clientes</h1>

      {clientes.length === 0 ? (
        <p className="mb-4 rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          Todavía no hay clientes. Se agregan solos cuando confirmas un pedido de la tienda.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crema text-lg">
                👤
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold">{cliente.nombre}</span>
                <span className="block text-[11.5px] text-gris">
                  {cliente.telefono ?? "sin teléfono"} · {cliente.compras} compra(s)
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[13px] font-black">
                  {formatearPrecio(cliente.gastado)}
                </span>
                {cliente.debe > 0 && (
                  <span className="block text-[10.5px] font-extrabold text-rojo">
                    debe {formatearPrecio(cliente.debe)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={crearCliente} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-extrabold">Agregar cliente</h2>
        <div className="space-y-2.5">
          <input name="nombre" required placeholder="Nombre del cliente" className={CAMPO} />
          <input name="telefono" placeholder="Número de celular" className={CAMPO} />
          <input name="correo" type="email" placeholder="correo@ejemplo.com" className={CAMPO} />
          <input name="direccion" placeholder="Dirección" className={CAMPO} />
        </div>
        <button
          type="submit"
          className="mt-3 w-full rounded-xl bg-tinta py-3.5 text-[13.5px] font-extrabold text-white transition hover:opacity-90"
        >
          Guardar cliente
        </button>
      </form>
    </>
  );
}
