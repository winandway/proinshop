import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { registrarAbono } from "./acciones";

export const metadata: Metadata = { title: "Cuentas por cobrar", robots: { index: false } };

export default async function Deudas() {
  const db = await baseDeDatos();

  const deudas = db
    ? (
        await db
          .prepare(
            `SELECT d.id, d.monto, d.saldo, d.vence, c.nombre, c.telefono,
                    (SELECT COUNT(*) FROM abono WHERE deuda_id = d.id) AS abonos,
                    (SELECT COALESCE(SUM(monto), 0) FROM abono WHERE deuda_id = d.id) AS abonado
             FROM deuda d JOIN cliente c ON c.id = d.cliente_id
             WHERE d.saldo > 0 ORDER BY d.vence`,
          )
          .all<{
            id: number;
            monto: number;
            saldo: number;
            vence: string | null;
            nombre: string;
            telefono: string | null;
            abonos: number;
            abonado: number;
          }>()
      ).results
    : [];

  const total = deudas.reduce((suma, d) => suma + d.saldo, 0);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Cuentas por cobrar</h1>

      <div className="mb-4 rounded-2xl bg-linear-to-br from-[#ff3b3b] to-[#d91414] p-4 text-white shadow-lg">
        <p className="text-xs font-semibold opacity-90">Total por cobrar</p>
        <p className="mt-0.5 text-3xl font-black tracking-tight">{formatearPrecio(total)}</p>
        <p className="mt-1 text-[11.5px] opacity-90">
          {deudas.length} cliente(s) ·{" "}
          {deudas.filter((d) => d.vence && d.vence < hoy).length} vencida(s)
        </p>
      </div>

      {deudas.length === 0 ? (
        <p className="rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          Nadie te debe nada. Las ventas fiadas aparecen aquí.
        </p>
      ) : (
        <ul className="space-y-3">
          {deudas.map((deuda) => {
            const vencida = deuda.vence !== null && deuda.vence < hoy;
            const telefono = deuda.telefono?.replace(/\D/g, "") ?? "";
            const recordatorio = `Hola ${deuda.nombre}, te recordamos tu saldo pendiente de ${formatearPrecio(deuda.saldo)} con Proinshop.`;

            return (
              <li key={deuda.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crema text-lg">
                    👤
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold">{deuda.nombre}</p>
                    <p className="text-[11.5px] text-gris">{deuda.telefono ?? "sin teléfono"}</p>
                  </div>
                  {vencida && (
                    <span className="shrink-0 rounded-md bg-rojo-suave px-2 py-1 text-[10px] font-extrabold text-rojo-oscuro">
                      Vencida
                    </span>
                  )}
                </div>

                <div className="mt-3 border-t border-linea pt-3">
                  <p className="text-[11.5px] font-semibold text-gris">Total por cobrar</p>
                  <p className="text-2xl font-black tracking-tight">
                    {formatearPrecio(deuda.saldo)}
                  </p>
                  <p className="mt-1 text-[11.5px] text-gris">
                    {deuda.abonos} abono(s) · {formatearPrecio(deuda.abonado)} abonado de{" "}
                    {formatearPrecio(deuda.monto)}
                  </p>
                </div>

                <form action={registrarAbono} className="mt-3 flex gap-2">
                  <input type="hidden" name="deuda_id" value={deuda.id} />
                  <input
                    name="monto"
                    required
                    inputMode="decimal"
                    placeholder="Monto del abono"
                    className="min-w-0 flex-1 rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[12.5px] font-semibold outline-none placeholder:font-normal placeholder:text-gris2 focus:border-rojo"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-tinta px-4 py-2.5 text-[12.5px] font-extrabold text-white transition hover:opacity-90"
                  >
                    Registrar abono
                  </button>
                </form>

                <a
                  href={`https://wa.me/${telefono}?text=${encodeURIComponent(recordatorio)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block rounded-xl border-[1.5px] border-linea py-2.5 text-center text-[12.5px] font-bold transition hover:border-gris2"
                >
                  Enviar recordatorio de pago
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
