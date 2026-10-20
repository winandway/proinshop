import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { NOMBRE_METODO } from "@/lib/metodos";
import { cajaAbierta, efectivoEsperado, movimientosDesde, type PorMetodo } from "@/lib/caja";
import { GuardaBorrador, LimpiarBorrador } from "@/componentes/GuardaBorrador";
import { exigir } from "@/lib/sesion";
import { horaLocal, minutosZona } from "@/lib/zona";
import { abrirCaja, cerrarCaja } from "./acciones";

export const metadata: Metadata = { title: "Caja", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

function Fila({ titulo, grupo, signo }: { titulo: string; grupo: PorMetodo; signo: "+" | "-" }) {
  const metodos = Object.entries(grupo).filter(([, monto]) => monto !== 0);
  if (metodos.length === 0) return null;
  return (
    <div className="border-b border-linea py-2.5 last:border-0">
      <p className="text-[12px] font-extrabold">{titulo}</p>
      {metodos.map(([metodo, monto]) => (
        <p key={metodo} className="flex justify-between text-[12.5px] text-gris">
          <span>{NOMBRE_METODO[metodo] ?? metodo}</span>
          <span className="font-bold text-tinta">
            {signo}
            {formatearPrecio(monto)}
          </span>
        </p>
      ))}
    </div>
  );
}

/**
 * Caja, como en Treinta: se abre con el efectivo con que arranca el día y se
 * cierra contando lo que hay. Muestra lo que entró y salió por cada método y
 * si el cajón cuadra, falta o sobra.
 */
export default async function Caja({
  searchParams,
}: {
  searchParams: Promise<{ cerrada?: string; abierta?: string }>;
}) {
  await exigir("caja");
  const { cerrada, abierta } = await searchParams;
  const db = await baseDeDatos();
  const minutos = await minutosZona();
  const caja = db ? await cajaAbierta(db) : null;
  const movimientos = db && caja ? await movimientosDesde(db, caja.abierta_en, null) : null;
  const esperado = caja && movimientos ? efectivoEsperado(caja.monto_inicial, movimientos) : 0;

  const historial = db
    ? (
        await db
          .prepare(
            `SELECT c.id, c.abierta_en, c.cerrada_en, c.monto_inicial, c.efectivo_esperado,
                    c.efectivo_contado, c.diferencia, c.nota, u.nombre AS cerro
             FROM caja c LEFT JOIN usuario u ON u.id = c.cerrada_por
             WHERE c.cerrada_en IS NOT NULL ORDER BY c.id DESC LIMIT 20`,
          )
          .all<{
            id: number;
            abierta_en: string;
            cerrada_en: string;
            monto_inicial: number;
            efectivo_esperado: number;
            efectivo_contado: number;
            diferencia: number;
            nota: string | null;
            cerro: string | null;
          }>()
      ).results
    : [];

  const recienCerrada = cerrada ? historial.find((c) => c.id === Number(cerrada)) : null;

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Caja</h1>
      </div>

      {abierta && <LimpiarBorrador claves={["caja-abrir"]} />}
      {recienCerrada && <LimpiarBorrador claves={["caja-cerrar"]} />}

      {recienCerrada && (
        <p
          role="status"
          className={`mb-3 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-bold ${
            recienCerrada.diferencia === 0
              ? "border-verde bg-verde-suave text-verde"
              : "border-rojo bg-rojo-suave text-rojo-oscuro"
          }`}
        >
          {recienCerrada.diferencia === 0
            ? "Caja cerrada: cuadró exacto."
            : recienCerrada.diferencia < 0
              ? `Caja cerrada: faltan ${formatearPrecio(-recienCerrada.diferencia)}.`
              : `Caja cerrada: sobran ${formatearPrecio(recienCerrada.diferencia)}.`}
        </p>
      )}

      {caja && movimientos ? (
        <>
          <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-verde">● Caja abierta</p>
            <p className="mt-1 text-[12.5px] text-gris">
              Desde {horaLocal(caja.abierta_en, minutos)}
              {caja.abierta_por ? ` · la abrió ${caja.abierta_por}` : ""}
            </p>
            <div className="mt-3">
              <p className="flex justify-between border-b border-linea py-2.5 text-[12.5px]">
                <span className="font-extrabold">Efectivo al abrir</span>
                <span className="font-bold">{formatearPrecio(caja.monto_inicial)}</span>
              </p>
              <Fila titulo="Ventas" grupo={movimientos.ventas} signo="+" />
              <Fila titulo="Abonos de clientes" grupo={movimientos.abonos} signo="+" />
              <Fila titulo="Gastos" grupo={movimientos.gastos} signo="-" />
              <Fila titulo="Compras a proveedores" grupo={movimientos.compras} signo="-" />
            </div>
            <p className="mt-3 flex items-baseline justify-between rounded-xl bg-crema px-3.5 py-3">
              <span className="text-[12.5px] font-extrabold">Debe haber en efectivo</span>
              <span className="text-xl font-black tracking-tight">{formatearPrecio(esperado)}</span>
            </p>
          </div>

          <form action={cerrarCaja} className="rounded-2xl bg-white p-4 shadow-sm">
            <GuardaBorrador clave="caja-cerrar" />
            <h2 className="mb-3 text-[13px] font-extrabold">Cerrar la caja</h2>
            <label htmlFor="efectivo_contado" className="mb-1.5 block text-[12.5px] font-bold text-gris">
              ¿Cuánto efectivo hay en el cajón?
            </label>
            <input
              id="efectivo_contado"
              name="efectivo_contado"
              required
              inputMode="decimal"
              placeholder="$ 0"
              className={CAMPO}
            />
            <label htmlFor="nota" className="mb-1.5 mt-3 block text-[12.5px] font-bold text-gris">
              Nota (opcional)
            </label>
            <input id="nota" name="nota" placeholder="Por ejemplo, por qué falta o sobra" className={CAMPO} />
            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-tinta py-3.5 text-sm font-extrabold text-white transition hover:opacity-90"
            >
              Cerrar caja
            </button>
          </form>
        </>
      ) : (
        <form action={abrirCaja} className="rounded-2xl bg-white p-4 shadow-sm">
          <GuardaBorrador clave="caja-abrir" />
          <h2 className="text-[13px] font-extrabold">Abrir la caja</h2>
          <p className="mb-3 mt-1 text-[12px] text-gris">
            Escribe con cuánto efectivo arranca el cajón. Al cerrar, el sistema te dice si cuadra.
          </p>
          <label htmlFor="monto_inicial" className="mb-1.5 block text-[12.5px] font-bold text-gris">
            Efectivo al abrir
          </label>
          <input
            id="monto_inicial"
            name="monto_inicial"
            inputMode="decimal"
            placeholder="$ 0"
            className={CAMPO}
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-2xl bg-rojo py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
          >
            Abrir caja
          </button>
        </form>
      )}

      {historial.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-[13px] font-extrabold">Cierres anteriores</h2>
          <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {historial.map((cierre) => (
              <li key={cierre.id} className="border-b border-linea px-4 py-3 last:border-0">
                <p className="flex justify-between text-[12.5px]">
                  <span className="font-bold">{horaLocal(cierre.cerrada_en, minutos)}</span>
                  <span
                    className={`font-extrabold ${
                      cierre.diferencia === 0 ? "text-verde" : "text-rojo-oscuro"
                    }`}
                  >
                    {cierre.diferencia === 0
                      ? "Cuadró"
                      : cierre.diferencia < 0
                        ? `Faltan ${formatearPrecio(-cierre.diferencia)}`
                        : `Sobran ${formatearPrecio(cierre.diferencia)}`}
                  </span>
                </p>
                <p className="text-[11.5px] text-gris">
                  Esperado {formatearPrecio(cierre.efectivo_esperado)} · contado{" "}
                  {formatearPrecio(cierre.efectivo_contado)}
                  {cierre.cerro ? ` · ${cierre.cerro}` : ""}
                </p>
                {cierre.nota && <p className="mt-0.5 text-[11.5px] text-gris">{cierre.nota}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
