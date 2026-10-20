import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { crearCliente } from "../vender/acciones";
import { GuardaBorrador } from "@/componentes/GuardaBorrador";
import { exigir } from "@/lib/sesion";

export const metadata: Metadata = { title: "Clientes", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

const ORDENES = {
  nombre: { texto: "Nombre", sql: "c.nombre COLLATE NOCASE" },
  mejores: { texto: "Mejores clientes", sql: "gastado DESC, c.nombre" },
  deben: { texto: "Los que deben", sql: "debe DESC, c.nombre" },
  recientes: { texto: "Compraron hace poco", sql: "ultima DESC NULLS LAST, c.nombre" },
} as const;

export default async function Clientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; orden?: string; eliminado?: string }>;
}) {
  await exigir("clientes");
  const { q, orden, eliminado } = await searchParams;
  const elegido = orden && orden in ORDENES ? (orden as keyof typeof ORDENES) : "nombre";
  const db = await baseDeDatos();

  const filtro = q?.trim() ? "WHERE lower(c.nombre) LIKE ? OR c.telefono LIKE ?" : "";
  const valores = q?.trim() ? [`%${q.trim().toLowerCase()}%`, `%${q.trim()}%`] : [];

  const clientes = db
    ? (
        await db
          .prepare(
            `SELECT c.id, c.nombre, c.telefono,
                    (SELECT COUNT(*) FROM venta WHERE cliente_id = c.id AND COALESCE(anulada, 0) = 0) AS compras,
                    (SELECT COALESCE(SUM(total), 0) FROM venta WHERE cliente_id = c.id AND COALESCE(anulada, 0) = 0) AS gastado,
                    (SELECT COALESCE(SUM(saldo), 0) FROM deuda WHERE cliente_id = c.id) AS debe,
                    (SELECT MAX(fecha) FROM venta WHERE cliente_id = c.id AND COALESCE(anulada, 0) = 0) AS ultima
             FROM cliente c ${filtro} ORDER BY ${ORDENES[elegido].sql} LIMIT 500`,
          )
          .bind(...valores)
          .all<{
            id: number;
            nombre: string;
            telefono: string | null;
            compras: number;
            gastado: number;
            debe: number;
            ultima: string | null;
          }>()
      ).results
    : [];

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Clientes</h1>

      {eliminado && (
        <p role="status" className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde">
          Cliente eliminado.
        </p>
      )}

      <form className="mb-3 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o celular"
          aria-label="Buscar cliente"
          className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-[13px] shadow-sm outline-none placeholder:text-gris2"
        />
        <select
          name="orden"
          defaultValue={elegido}
          aria-label="Ordenar"
          className="w-40 rounded-xl bg-white px-3 text-[12.5px] font-semibold shadow-sm outline-none"
        >
          {Object.entries(ORDENES).map(([clave, opcion]) => (
            <option key={clave} value={clave}>
              {opcion.texto}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-tinta px-3 text-[12px] font-bold text-white">
          Ir
        </button>
      </form>

      {clientes.length === 0 ? (
        <p className="mb-4 rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          {q ? "No hay clientes con esa búsqueda." : "Todavía no hay clientes. Se agregan solos cuando confirmas un pedido de la tienda."}
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {clientes.map((cliente, indice) => (
            <li key={cliente.id}>
              <Link
                href={`/panel/clientes/${cliente.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crema text-lg">
                  {elegido === "mejores" && indice < 3 && cliente.gastado > 0 ? ["🥇", "🥈", "🥉"][indice] : "👤"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold">{cliente.nombre}</span>
                  <span className="block text-[11.5px] text-gris">
                    {cliente.telefono ?? "sin teléfono"} · {cliente.compras} compra(s)
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-black">{formatearPrecio(cliente.gastado)}</span>
                  {cliente.debe > 0 && (
                    <span className="block text-[10.5px] font-extrabold text-rojo">
                      debe {formatearPrecio(cliente.debe)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form id="nuevo" action={crearCliente} className="rounded-2xl bg-white p-4 shadow-sm">
        <GuardaBorrador clave="cliente-nuevo" />
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
