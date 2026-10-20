import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { ActivarNotificaciones } from "@/componentes/panel/AvisosEnVivo";
import { RefrescoAutomatico } from "@/componentes/panel/RefrescoAutomatico";
import { usuarioActual } from "@/lib/sesion";
import { horaLocal, minutosZona } from "@/lib/zona";

export const metadata: Metadata = { title: "Actividad del equipo", robots: { index: false } };

const ICONO: Record<string, string> = {
  venta: "💵",
  anulacion: "↩️",
  gasto: "📉",
  abono: "💰",
  compra: "🚚",
  ajuste: "📦",
  conteo: "📋",
  caja: "🗄",
  pedido: "🛒",
  importacion: "📥",
  masivo: "✏️",
};

/**
 * Lo que hace cada persona del equipo, al momento: ventas, anulaciones,
 * gastos, ajustes de stock, cierres de caja. Solo lo ve el propietario. Se
 * actualiza sola cada 30 segundos.
 */
export default async function Actividad({ searchParams }: { searchParams: Promise<{ persona?: string }> }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");
  if (usuario.rol !== "dueno") redirect("/panel?sin_permiso=1");

  const { persona } = await searchParams;
  const db = await baseDeDatos();
  const minutos = await minutosZona();

  const [movimientos, personas] = db
    ? await Promise.all([
        db
          .prepare(
            `SELECT a.id, a.fecha, a.tipo, a.detalle, a.monto, a.enlace, u.nombre
             FROM actividad a LEFT JOIN usuario u ON u.id = a.usuario_id
             ${persona ? "WHERE a.usuario_id = ?" : ""}
             ORDER BY a.id DESC LIMIT 200`,
          )
          .bind(...(persona ? [Number(persona)] : []))
          .all<{ id: number; fecha: string; tipo: string; detalle: string; monto: number | null; enlace: string | null; nombre: string | null }>()
          .then((r) => r.results),
        db.prepare("SELECT id, nombre FROM usuario ORDER BY nombre").all<{ id: number; nombre: string }>().then((r) => r.results),
      ])
    : [[], []];

  return (
    <>
      <RefrescoAutomatico />
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/explorar"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Actividad del equipo</h1>
      </div>

      <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-2 text-[12px] text-gris">
          Recibe un aviso en este celular o computadora cada vez que entra un pedido o alguien del
          equipo registra algo.
        </p>
        <ActivarNotificaciones />
      </div>

      <div className="sin-barra mb-3 flex gap-2 overflow-x-auto">
        <Link
          href="/panel/actividad"
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${
            !persona ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-gris"
          }`}
        >
          Todos
        </Link>
        {personas.map((p) => (
          <Link
            key={p.id}
            href={`/panel/actividad?persona=${p.id}`}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${
              Number(persona) === p.id ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-gris"
            }`}
          >
            {p.nombre}
          </Link>
        ))}
      </div>

      {movimientos.length === 0 ? (
        <p className="rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          Todavía no hay actividad registrada.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {movimientos.map((m) => {
            const contenido = (
              <>
                <span aria-hidden="true" className="text-lg">
                  {ICONO[m.tipo] ?? "•"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold">{m.detalle}</span>
                  <span className="block text-[11px] text-gris">
                    {m.nombre ?? "—"} · {horaLocal(m.fecha, minutos)}
                  </span>
                </span>
                {m.monto !== null && m.monto !== 0 && (
                  <span
                    className={`shrink-0 text-[12.5px] font-black ${
                      m.tipo === "anulacion" || (m.tipo === "caja" && m.monto < 0) ? "text-rojo-oscuro" : ""
                    }`}
                  >
                    {formatearPrecio(Math.abs(m.monto))}
                  </span>
                )}
              </>
            );
            return (
              <li key={m.id} className="border-b border-linea last:border-0">
                {m.enlace ? (
                  <Link href={m.enlace} className="flex items-center gap-3 px-4 py-3 hover:bg-crema">
                    {contenido}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
