import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { NOMBRE_METODO } from "@/lib/metodos";
import { GuardaBorrador, LimpiarBorrador } from "@/componentes/GuardaBorrador";
import { MenuTresPuntos } from "@/componentes/panel/MenuTresPuntos";
import { exigir } from "@/lib/sesion";
import { horaLocal, minutosZona } from "@/lib/zona";
import { editarCliente, eliminarCliente } from "../acciones";

export const metadata: Metadata = { title: "Cliente", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

/** La ficha del cliente: sus datos, todo lo que compró, lo que debe y lo que abonó. */
export default async function FichaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string; debe?: string }>;
}) {
  await exigir("clientes");
  const { id } = await params;
  const { guardado, debe } = await searchParams;
  const db = await baseDeDatos();
  if (!db) notFound();
  const minutos = await minutosZona();

  const cliente = await db
    .prepare("SELECT * FROM cliente WHERE id = ?")
    .bind(Number(id))
    .first<{
      id: number;
      nombre: string;
      telefono: string | null;
      correo: string | null;
      direccion: string | null;
      nota: string | null;
      creado_en: string;
    }>();
  if (!cliente) notFound();

  const [ventas, deudas, abonos, cotizaciones] = await Promise.all([
    db
      .prepare(
        `SELECT id, fecha, total, metodo_pago, canal, COALESCE(anulada, 0) AS anulada,
                (SELECT GROUP_CONCAT(cantidad || ' × ' || descripcion, ', ') FROM venta_item WHERE venta_id = venta.id) AS detalle
         FROM venta WHERE cliente_id = ? ORDER BY id DESC LIMIT 100`,
      )
      .bind(cliente.id)
      .all<{ id: number; fecha: string; total: number; metodo_pago: string; canal: string; anulada: number; detalle: string | null }>()
      .then((r) => r.results),
    db
      .prepare("SELECT id, monto, saldo, vence, creado_en, venta_id FROM deuda WHERE cliente_id = ? ORDER BY id DESC")
      .bind(cliente.id)
      .all<{ id: number; monto: number; saldo: number; vence: string | null; creado_en: string; venta_id: number | null }>()
      .then((r) => r.results),
    db
      .prepare(
        `SELECT a.fecha, a.monto, a.metodo_pago FROM abono a JOIN deuda d ON d.id = a.deuda_id
         WHERE d.cliente_id = ? ORDER BY a.id DESC LIMIT 50`,
      )
      .bind(cliente.id)
      .all<{ fecha: string; monto: number; metodo_pago: string | null }>()
      .then((r) => r.results),
    db
      .prepare("SELECT id, total, estado, token_publico, creado_en FROM cotizacion WHERE cliente_id = ? ORDER BY id DESC LIMIT 20")
      .bind(cliente.id)
      .all<{ id: number; total: number; estado: string; token_publico: string | null; creado_en: string }>()
      .then((r) => r.results),
  ]);

  const validas = ventas.filter((v) => !v.anulada);
  const gastado = validas.reduce((s, v) => s + v.total, 0);
  const saldo = deudas.reduce((s, d) => s + d.saldo, 0);
  const telefono = cliente.telefono?.replace(/\D/g, "") ?? "";

  return (
    <div className="pb-6">
      {guardado && <LimpiarBorrador claves={[`cliente-${cliente.id}`]} />}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/clientes"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-black tracking-tight">{cliente.nombre}</h1>
        <MenuTresPuntos
          etiqueta="Eliminar cliente"
          pregunta="¿Eliminar este cliente?"
          detalle="Sus compras se conservan en el balance, sin su nombre. Si debe algo, no se puede eliminar."
          confirmar="Sí, eliminar"
          accion={eliminarCliente}
          campos={{ id: cliente.id }}
        />
      </div>

      {guardado && (
        <p role="status" className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde">
          Datos guardados.
        </p>
      )}
      {debe && (
        <p role="alert" className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro">
          No se puede eliminar: todavía debe {formatearPrecio(saldo)}.
        </p>
      )}

      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[10.5px] font-semibold text-gris">Compró</p>
          <p className="text-[15px] font-black">{formatearPrecio(gastado)}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[10.5px] font-semibold text-gris">Compras</p>
          <p className="text-[15px] font-black">{validas.length}</p>
        </div>
        <div className={`rounded-2xl p-3 shadow-sm ${saldo > 0 ? "bg-rojo-suave" : "bg-white"}`}>
          <p className="text-[10.5px] font-semibold text-gris">Debe</p>
          <p className={`text-[15px] font-black ${saldo > 0 ? "text-rojo-oscuro" : ""}`}>{formatearPrecio(saldo)}</p>
        </div>
      </div>

      {telefono && (
        <a
          href={`https://wa.me/${telefono}?text=${encodeURIComponent(
            saldo > 0
              ? `Hola ${cliente.nombre}, te recordamos tu saldo pendiente de ${formatearPrecio(saldo)}.`
              : `Hola ${cliente.nombre}, `,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 block rounded-2xl bg-whatsapp py-3 text-center text-[13px] font-extrabold text-white"
        >
          {saldo > 0 ? "Recordarle el pago por WhatsApp" : "Escribirle por WhatsApp"}
        </a>
      )}

      <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-[13px] font-extrabold">Historial de compras</h2>
        {ventas.length === 0 ? (
          <p className="text-[12.5px] text-gris">Todavía no tiene compras.</p>
        ) : (
          <ul>
            {ventas.map((venta) => (
              <li key={venta.id} className="border-b border-linea last:border-0">
                <Link href={`/panel/vender/${venta.id}`} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[12.5px] font-bold ${venta.anulada ? "text-gris line-through" : ""}`}>
                      {venta.detalle ?? `Venta #${venta.id}`}
                    </span>
                    <span className="block text-[11px] text-gris">
                      {horaLocal(venta.fecha, minutos)} · {NOMBRE_METODO[venta.metodo_pago] ?? venta.metodo_pago}
                      {venta.canal === "web" ? " · tienda" : ""}
                      {venta.anulada ? " · anulada" : ""}
                    </span>
                  </span>
                  <span className="text-[13px] font-black">{formatearPrecio(venta.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(deudas.length > 0 || abonos.length > 0) && (
        <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-extrabold">Fiado y abonos</h2>
            <Link href="/panel/deudas" className="text-[12px] font-bold text-rojo">
              Registrar abono →
            </Link>
          </div>
          <ul className="space-y-1.5">
            {deudas.map((deuda) => (
              <li key={deuda.id} className="flex justify-between text-[12.5px]">
                <span className="text-gris">
                  Fiado {formatearPrecio(deuda.monto)} · {deuda.vence ? `vence ${deuda.vence}` : ""}
                </span>
                <span className={`font-bold ${deuda.saldo > 0 ? "text-rojo-oscuro" : "text-verde"}`}>
                  {deuda.saldo > 0 ? `debe ${formatearPrecio(deuda.saldo)}` : "pagado"}
                </span>
              </li>
            ))}
            {abonos.map((abono, indice) => (
              <li key={`a${indice}`} className="flex justify-between text-[12px] text-gris">
                <span>
                  Abono · {horaLocal(abono.fecha, minutos)}
                  {abono.metodo_pago ? ` · ${NOMBRE_METODO[abono.metodo_pago] ?? abono.metodo_pago}` : ""}
                </span>
                <span className="font-bold text-verde">{formatearPrecio(abono.monto)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cotizaciones.length > 0 && (
        <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-[13px] font-extrabold">Cotizaciones</h2>
          <ul className="space-y-1.5">
            {cotizaciones.map((c) => (
              <li key={c.id} className="flex justify-between text-[12.5px]">
                <span className="text-gris">
                  #{c.id} · {c.estado}
                </span>
                <span className="font-bold">{formatearPrecio(c.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={editarCliente} className="rounded-2xl bg-white p-4 shadow-sm">
        <GuardaBorrador clave={`cliente-${cliente.id}`} />
        <input type="hidden" name="id" value={cliente.id} />
        <h2 className="mb-3 text-[13px] font-extrabold">Datos del cliente</h2>
        <div className="space-y-2.5">
          <input name="nombre" required defaultValue={cliente.nombre} placeholder="Nombre del cliente" className={CAMPO} />
          <input name="telefono" defaultValue={cliente.telefono ?? ""} placeholder="Número de celular" className={CAMPO} />
          <input name="correo" type="email" defaultValue={cliente.correo ?? ""} placeholder="correo@ejemplo.com" className={CAMPO} />
          <input name="direccion" defaultValue={cliente.direccion ?? ""} placeholder="Dirección" className={CAMPO} />
          <textarea
            name="nota"
            rows={2}
            defaultValue={cliente.nota ?? ""}
            placeholder="Nota: preferencias, cómo contactarlo…"
            className={`${CAMPO} resize-y`}
          />
        </div>
        <button
          type="submit"
          className="mt-3 w-full rounded-xl bg-tinta py-3.5 text-[13.5px] font-extrabold text-white transition hover:opacity-90"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
