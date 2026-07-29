import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false } };

const ESTADOS = [
  { valor: "nuevo", texto: "Nuevos" },
  { valor: "preparando", texto: "Preparando" },
  { valor: "enviado", texto: "Enviados" },
  { valor: "entregado", texto: "Entregados" },
];

const COLOR: Record<string, string> = {
  nuevo: "bg-rojo-suave text-rojo-oscuro",
  preparando: "bg-[#fff6df] text-[#8a6100]",
  enviado: "bg-[#e6f1fb] text-[#0c447c]",
  entregado: "bg-verde-suave text-verde",
  cancelado: "bg-crema text-gris",
};

export default async function Pedidos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const db = await baseDeDatos();

  const pedidos = db
    ? (
        await db
          .prepare(
            `SELECT id, numero, fecha, estado, cliente_nombre, metodo_pago, total,
                    (SELECT COUNT(*) FROM pedido_item WHERE pedido_id = pedido.id) AS articulos
             FROM pedido
             ${estado ? "WHERE estado = ?" : ""}
             ORDER BY id DESC LIMIT 100`,
          )
          .bind(...(estado ? [estado] : []))
          .all<{
            id: number;
            numero: string;
            fecha: string;
            estado: string;
            cliente_nombre: string;
            metodo_pago: string;
            total: number;
            articulos: number;
          }>()
      ).results
    : [];

  const nuevos = db
    ? await db
        .prepare("SELECT COUNT(*) AS total FROM pedido WHERE estado = 'nuevo'")
        .first<{ total: number }>()
    : null;

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Pedidos de la tienda</h1>

      <div className="sin-barra mb-3 flex gap-2 overflow-x-auto">
        <Link
          href="/panel/pedidos"
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
            !estado ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-gris"
          }`}
        >
          Todos
        </Link>
        {ESTADOS.map((opcion) => (
          <Link
            key={opcion.valor}
            href={`/panel/pedidos?estado=${opcion.valor}`}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
              estado === opcion.valor
                ? "border-tinta bg-tinta text-white"
                : "border-linea bg-white text-gris"
            }`}
          >
            {opcion.texto}
            {opcion.valor === "nuevo" && (nuevos?.total ?? 0) > 0 && ` · ${nuevos?.total}`}
          </Link>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <p className="rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          Todavía no hay pedidos. Cuando alguien compre en la tienda, aparece aquí.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <Link
                href={`/panel/pedidos/${pedido.id}`}
                className={`block rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md ${
                  pedido.estado === "nuevo" ? "border-l-4 border-rojo" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-extrabold">Pedido #{pedido.numero}</p>
                    <p className="mt-0.5 text-[11.5px] text-gris">
                      {pedido.fecha.slice(0, 16).replace("T", " ")} · 🌐 Tienda virtual
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-extrabold capitalize ${
                      COLOR[pedido.estado] ?? "bg-crema text-gris"
                    }`}
                  >
                    {pedido.estado}
                  </span>
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-3">
                  <p className="min-w-0 truncate text-[12.5px] text-gris">
                    {pedido.cliente_nombre} · {pedido.articulos} artículo(s)
                  </p>
                  <p className="shrink-0 text-[15px] font-black">
                    {formatearPrecio(pedido.total)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
