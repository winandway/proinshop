import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { datosNegocio } from "@/lib/negocio";

export const metadata: Metadata = { title: "Venta registrada", robots: { index: false } };

export default async function VentaRegistrada({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await baseDeDatos();
  if (!db) notFound();

  const venta = await db
    .prepare(
      `SELECT v.*, c.nombre AS cliente, c.telefono
       FROM venta v LEFT JOIN cliente c ON c.id = v.cliente_id
       WHERE v.id = ?`,
    )
    .bind(Number(id))
    .first<{
      id: number;
      fecha: string;
      metodo_pago: string;
      subtotal: number;
      descuento: number;
      total: number;
      pagada: number;
      cliente: string | null;
      telefono: string | null;
    }>();

  if (!venta) notFound();

  const { results: items } = await db
    .prepare("SELECT descripcion, cantidad, precio_unit FROM venta_item WHERE venta_id = ?")
    .bind(venta.id)
    .all<{ descripcion: string; cantidad: number; precio_unit: number }>();

  const negocio = await datosNegocio();

  const comprobante = [
    `${negocio.nombre} — Comprobante de venta #${venta.id}`,
    venta.fecha.slice(0, 16).replace("T", " "),
    "",
    ...items.map(
      (i) => `${i.cantidad} × ${i.descripcion} — ${formatearPrecio(i.precio_unit * i.cantidad)}`,
    ),
    "",
    `Total: ${formatearPrecio(venta.total)}`,
    venta.pagada === 1 ? "Pagado" : "Pendiente de pago",
  ].join("\n");

  return (
    <div className="mx-auto max-w-md text-center">
      <span
        aria-hidden="true"
        className="mx-auto mt-4 grid h-20 w-20 place-items-center rounded-full bg-verde-suave text-4xl"
      >
        ✅
      </span>
      <h1 className="mt-4 text-xl font-black tracking-tight">¡Creaste una venta!</h1>
      <p className="mt-1.5 text-[13px] text-gris">
        Se registró en tu balance por {formatearPrecio(venta.total)} y se descontó del inventario.
      </p>

      <div className="mt-5 rounded-2xl bg-white p-4 text-left shadow-sm">
        <ul className="space-y-2">
          {items.map((item, indice) => (
            <li key={indice} className="flex justify-between text-[13px]">
              <span className="text-gris">
                {item.cantidad} × {item.descripcion}
              </span>
              <span className="font-bold">
                {formatearPrecio(item.precio_unit * item.cantidad)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-dashed border-linea pt-3">
          <span className="font-black">Total</span>
          <span className="text-lg font-black tracking-tight">{formatearPrecio(venta.total)}</span>
        </div>
        {venta.pagada === 0 && (
          <p className="mt-2 rounded-lg bg-rojo-suave px-3 py-2 text-[11.5px] font-bold text-rojo-oscuro">
            Venta fiada{venta.cliente ? ` a ${venta.cliente}` : ""} — quedó en cuentas por cobrar.
          </p>
        )}
      </div>

      <a
        href={`https://wa.me/${venta.telefono?.replace(/\D/g, "") ?? ""}?text=${encodeURIComponent(comprobante)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block rounded-2xl bg-whatsapp py-3.5 text-sm font-extrabold text-white transition hover:brightness-95"
      >
        Enviar comprobante por WhatsApp
      </a>
      <Link
        href="/panel/vender"
        className="mt-2 block rounded-2xl bg-rojo py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
      >
        Registrar otra venta
      </Link>
      <Link
        href="/panel"
        className="mt-2 block rounded-2xl border-[1.5px] border-linea py-3.5 text-sm font-extrabold transition hover:border-gris2"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
