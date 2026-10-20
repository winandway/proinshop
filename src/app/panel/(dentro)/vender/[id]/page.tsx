import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { datosNegocio } from "@/lib/negocio";
import { NOMBRE_METODO } from "@/lib/metodos";
import { enMoneda2 } from "@/lib/moneda";
import { LimpiarBorrador } from "@/componentes/GuardaBorrador";
import { BotonImprimir } from "@/componentes/panel/BotonImprimir";
import { MenuTresPuntos } from "@/componentes/panel/MenuTresPuntos";
import { exigir, puede } from "@/lib/sesion";
import { horaLocal, minutosZona } from "@/lib/zona";
import { anularVenta } from "../acciones";

export const metadata: Metadata = { title: "Venta", robots: { index: false } };

/**
 * La venta y su comprobante. El comprobante se manda por WhatsApp o por
 * correo, o se imprime / guarda en PDF con el diálogo del navegador.
 */
export default async function VentaRegistrada({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const usuario = await exigir("vender");
  const { id } = await params;
  const { nueva } = await searchParams;
  const db = await baseDeDatos();
  if (!db) notFound();

  const venta = await db
    .prepare(
      `SELECT v.*, c.nombre AS cliente, c.telefono, c.correo AS correo_cliente, u.nombre AS vendedor
       FROM venta v
       LEFT JOIN cliente c ON c.id = v.cliente_id
       LEFT JOIN usuario u ON u.id = v.usuario_id
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
      nota: string | null;
      anulada: number | null;
      cliente: string | null;
      telefono: string | null;
      correo_cliente: string | null;
      vendedor: string | null;
    }>();

  if (!venta) notFound();

  const [{ results: items }, { results: pagos }] = await Promise.all([
    db
      .prepare("SELECT descripcion, cantidad, precio_unit FROM venta_item WHERE venta_id = ?")
      .bind(venta.id)
      .all<{ descripcion: string; cantidad: number; precio_unit: number }>(),
    db
      .prepare("SELECT metodo, monto FROM venta_pago WHERE venta_id = ? ORDER BY id")
      .bind(venta.id)
      .all<{ metodo: string; monto: number }>(),
  ]);

  const negocio = await datosNegocio();
  const minutos = await minutosZona();
  const anulada = (venta.anulada ?? 0) === 1;
  const otra = enMoneda2(venta.total, negocio.moneda2, negocio.tasa2);

  const comprobante = [
    `${negocio.nombre} — Comprobante de venta #${venta.id}`,
    horaLocal(venta.fecha, minutos),
    "",
    ...items.map(
      (i) => `${i.cantidad} × ${i.descripcion} — ${formatearPrecio(i.precio_unit * i.cantidad)}`,
    ),
    "",
    ...(venta.descuento > 0 ? [`Descuento: -${formatearPrecio(venta.descuento)}`] : []),
    `Total: ${formatearPrecio(venta.total)}${otra ? ` (${otra})` : ""}`,
    `Pago: ${pagos.map((p) => `${NOMBRE_METODO[p.metodo] ?? p.metodo} ${formatearPrecio(p.monto)}`).join(" + ")}`,
    ...(venta.nota ? ["", venta.nota] : []),
    "",
    "¡Gracias por tu compra!",
  ].join("\n");

  return (
    <div className="mx-auto max-w-md">
      {nueva && <LimpiarBorrador claves={["venta"]} />}

      <div className="mb-4 flex items-center gap-3 print:hidden">
        <Link
          href="/panel/vender"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="flex-1 text-lg font-black tracking-tight">Venta #{venta.id}</h1>
        {!anulada && puede(usuario, "anular") && (
          <MenuTresPuntos
            etiqueta="Anular venta"
            pregunta="¿Anular esta venta?"
            detalle="La mercancía vuelve al inventario, la deuda (si había) se borra y la venta deja de contar en el balance."
            confirmar="Sí, anular"
            accion={anularVenta}
            campos={{ id: venta.id }}
          />
        )}
      </div>

      {nueva && !anulada && (
        <div className="mb-4 text-center print:hidden">
          <span
            aria-hidden="true"
            className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-verde-suave text-3xl"
          >
            ✅
          </span>
          <p className="mt-2 text-lg font-black tracking-tight">¡Creaste una venta!</p>
          <p className="text-[12.5px] text-gris">Se sumó a tu balance y se descontó del inventario.</p>
        </div>
      )}

      {anulada && (
        <p className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro">
          Esta venta está anulada: no cuenta en el balance y la mercancía volvió al inventario.
        </p>
      )}

      {/* El comprobante: es lo único que sale al imprimir. */}
      <article className="rounded-2xl bg-white p-5 shadow-sm print:shadow-none">
        <header className="border-b border-dashed border-linea pb-3 text-center">
          <p className="text-lg font-black tracking-tight">{negocio.nombre}</p>
          {negocio.direccion && <p className="text-[11.5px] text-gris">{negocio.direccion}</p>}
          {negocio.whatsapp && <p className="text-[11.5px] text-gris">WhatsApp +{negocio.whatsapp}</p>}
          <p className="mt-2 text-[12px] font-bold">Comprobante de venta #{venta.id}</p>
          <p className="text-[11.5px] text-gris">{horaLocal(venta.fecha, minutos)}</p>
          {venta.cliente && <p className="text-[11.5px] text-gris">Cliente: {venta.cliente}</p>}
          {venta.vendedor && <p className="text-[11.5px] text-gris">Atendió: {venta.vendedor}</p>}
        </header>

        <ul className="space-y-2 py-3">
          {items.map((item, indice) => (
            <li key={indice} className="flex justify-between gap-3 text-[13px]">
              <span className="text-gris">
                {item.cantidad} × {item.descripcion}
              </span>
              <span className="shrink-0 font-bold">
                {formatearPrecio(item.precio_unit * item.cantidad)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-1 border-t border-dashed border-linea pt-3 text-[13px]">
          {venta.descuento > 0 && (
            <>
              <div className="flex justify-between">
                <dt className="text-gris">Subtotal</dt>
                <dd className="font-bold">{formatearPrecio(venta.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gris">Descuento</dt>
                <dd className="font-bold">-{formatearPrecio(venta.descuento)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between pt-1">
            <dt className="font-black">Total</dt>
            <dd className="text-right">
              <span className="block text-lg font-black tracking-tight">{formatearPrecio(venta.total)}</span>
              {otra && <span className="block text-[11.5px] font-bold text-gris">{otra}</span>}
            </dd>
          </div>
          {pagos.map((pago, indice) => (
            <div key={indice} className="flex justify-between text-[12px]">
              <dt className="text-gris">{NOMBRE_METODO[pago.metodo] ?? pago.metodo}</dt>
              <dd className="font-bold">{formatearPrecio(pago.monto)}</dd>
            </div>
          ))}
        </dl>

        {venta.nota && (
          <p className="mt-3 rounded-lg bg-crema px-3 py-2 text-[12px] text-gris">{venta.nota}</p>
        )}
        {venta.pagada === 0 && !anulada && (
          <p className="mt-3 rounded-lg bg-rojo-suave px-3 py-2 text-[11.5px] font-bold text-rojo-oscuro">
            Queda una parte fiada{venta.cliente ? ` a ${venta.cliente}` : ""}: está en cuentas por cobrar.
          </p>
        )}
        <p className="mt-4 text-center text-[11.5px] text-gris">¡Gracias por tu compra!</p>
      </article>

      <div className="mt-4 space-y-2 print:hidden">
        <a
          href={`https://wa.me/${venta.telefono?.replace(/\D/g, "") ?? ""}?text=${encodeURIComponent(comprobante)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-whatsapp py-3.5 text-center text-sm font-extrabold text-white transition hover:brightness-95"
        >
          Enviar comprobante por WhatsApp
        </a>
        <a
          href={`mailto:${venta.correo_cliente ?? ""}?subject=${encodeURIComponent(`Comprobante de venta #${venta.id} — ${negocio.nombre}`)}&body=${encodeURIComponent(comprobante)}`}
          className="block rounded-2xl border-[1.5px] border-linea bg-white py-3.5 text-center text-sm font-extrabold transition hover:border-gris2"
        >
          ✉️ Enviar por correo
        </a>
        <BotonImprimir />
        <Link
          href="/panel/vender"
          className="block rounded-2xl bg-rojo py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
        >
          Registrar otra venta
        </Link>
      </div>
    </div>
  );
}
