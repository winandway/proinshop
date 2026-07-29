import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { cambiarEstadoPedido, confirmarPedido } from "../acciones";

export const metadata: Metadata = { title: "Pedido", robots: { index: false } };

const PASOS = [
  { estado: "nuevo", texto: "Pedido recibido" },
  { estado: "preparando", texto: "Preparando" },
  { estado: "enviado", texto: "En camino" },
  { estado: "entregado", texto: "Entregado" },
];

export default async function DetallePedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await baseDeDatos();
  if (!db) notFound();

  const pedido = await db
    .prepare("SELECT * FROM pedido WHERE id = ?")
    .bind(Number(id))
    .first<{
      id: number;
      numero: string;
      fecha: string;
      estado: string;
      cliente_nombre: string;
      cliente_telefono: string;
      cliente_correo: string | null;
      direccion: string | null;
      entrega: string;
      metodo_pago: string;
      subtotal: number;
      envio: number;
      total: number;
      venta_id: number | null;
    }>();

  if (!pedido) notFound();

  const { results: items } = await db
    .prepare("SELECT descripcion, cantidad, precio_unit FROM pedido_item WHERE pedido_id = ?")
    .bind(pedido.id)
    .all<{ descripcion: string; cantidad: number; precio_unit: number }>();

  const indiceActual = PASOS.findIndex((p) => p.estado === pedido.estado);
  const telefono = pedido.cliente_telefono.replace(/\D/g, "");

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/pedidos"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Pedido #{pedido.numero}</h1>
      </div>

      <ol className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        {PASOS.map((paso, indice) => (
          <li key={paso.estado} className="relative flex gap-4 pb-4 last:pb-0">
            {indice < PASOS.length - 1 && (
              <span aria-hidden="true" className="absolute left-[5px] top-4 h-full w-0.5 bg-linea" />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${
                indice < indiceActual
                  ? "bg-verde"
                  : indice === indiceActual
                    ? "bg-rojo ring-4 ring-rojo-suave"
                    : "bg-linea"
              }`}
            />
            <span className="text-[13px] font-bold">{paso.texto}</span>
          </li>
        ))}
      </ol>

      <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-extrabold">Productos</h2>
        <ul className="space-y-2">
          {items.map((item, indice) => (
            <li key={indice} className="flex justify-between text-[13px]">
              <span className="text-gris">
                {item.cantidad} × {item.descripcion}
              </span>
              <span className="font-bold">{formatearPrecio(item.precio_unit * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-dashed border-linea pt-3 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-gris">Subtotal</dt>
            <dd className="font-bold">{formatearPrecio(pedido.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gris">Envío</dt>
            <dd className="font-bold">
              {pedido.envio > 0 ? formatearPrecio(pedido.envio) : "Recoge en el local"}
            </dd>
          </div>
          <div className="flex justify-between pt-1">
            <dt className="font-black">Total</dt>
            <dd className="text-lg font-black tracking-tight">{formatearPrecio(pedido.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-3 rounded-2xl bg-white p-4 text-[12.5px] shadow-sm">
        <h2 className="mb-2 text-[13px] font-extrabold">Entrega y contacto</h2>
        <p className="font-bold">{pedido.cliente_nombre}</p>
        <p className="mt-1 text-gris">📞 {pedido.cliente_telefono}</p>
        {pedido.cliente_correo && <p className="text-gris">✉️ {pedido.cliente_correo}</p>}
        {pedido.direccion && <p className="text-gris">📍 {pedido.direccion}</p>}
        <p className="mt-1 text-gris">
          {pedido.entrega === "domicilio" ? "🚚 Envío a domicilio" : "🏪 Recoge en el local"} ·{" "}
          {pedido.metodo_pago}
        </p>
      </div>

      {pedido.estado === "nuevo" ? (
        <form action={confirmarPedido}>
          <input type="hidden" name="id" value={pedido.id} />
          <button
            type="submit"
            className="w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
          >
            Confirmar pedido y registrar la venta
          </button>
          <p className="mt-2 text-center text-[11.5px] text-gris">
            Descuenta el stock y suma al balance.
          </p>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {PASOS.slice(1).map((paso) => (
            <form key={paso.estado} action={cambiarEstadoPedido}>
              <input type="hidden" name="id" value={pedido.id} />
              <input type="hidden" name="estado" value={paso.estado} />
              <button
                type="submit"
                disabled={pedido.estado === paso.estado}
                className={`rounded-full border px-4 py-2.5 text-[12px] font-bold transition ${
                  pedido.estado === paso.estado
                    ? "border-tinta bg-tinta text-white"
                    : "border-linea bg-white text-gris hover:border-gris2"
                }`}
              >
                {paso.texto}
              </button>
            </form>
          ))}
        </div>
      )}

      <a
        href={`https://wa.me/${telefono}?text=${encodeURIComponent(
          `Hola ${pedido.cliente_nombre}, te escribimos por tu pedido #${pedido.numero} en Proinshop.`,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 block rounded-2xl bg-whatsapp py-3.5 text-center text-sm font-extrabold text-white transition hover:brightness-95"
      >
        Escribirle por WhatsApp
      </a>
    </>
  );
}
