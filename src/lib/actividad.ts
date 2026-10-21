import { baseDeDatos } from "./d1";
import { formatearPrecio } from "./i18n";
import { avisarPorDetras } from "./avisos-push";

const ICONO: Record<string, string> = {
  venta: "💵",
  anulacion: "↩️",
  caja: "🗄",
  gasto: "📉",
  abono: "💰",
  compra: "🚚",
  ajuste: "📦",
  conteo: "📋",
  pedido: "🛒",
};

/**
 * Deja anotado lo que hizo alguien del equipo: una venta, un gasto, un
 * ajuste, una anulación. El dueño lo ve en Actividad casi al momento.
 * Si anotar falla, la operación de verdad no se cae por eso, pero queda en el
 * registro de errores.
 */
export async function anotarActividad(datos: {
  usuarioId: number;
  tipo: string;
  detalle: string;
  monto?: number | null;
  enlace?: string | null;
}) {
  const db = await baseDeDatos();
  if (!db) return;
  try {
    const fila = await db
      .prepare(
        "INSERT INTO actividad (usuario_id, tipo, detalle, monto, enlace) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(datos.usuarioId, datos.tipo, datos.detalle.slice(0, 200), datos.monto ?? null, datos.enlace ?? null)
      .run();

    // Lo que hace el equipo le llega al dueño al celular, como en Treinta. Lo
    // que hace el propio dueño no se lo avisa a sí mismo.
    const quien = await db
      .prepare("SELECT nombre, rol FROM usuario WHERE id = ?")
      .bind(datos.usuarioId)
      .first<{ nombre: string; rol: string }>();
    if (quien && quien.rol !== "dueno") {
      const monto = typeof datos.monto === "number" ? ` · ${formatearPrecio(datos.monto)}` : "";
      await avisarPorDetras(
        db,
        { soloPropietarios: true },
        {
          titulo: `${ICONO[datos.tipo] ?? "🔔"} ${quien.nombre}`,
          cuerpo: `${datos.detalle}${monto}`.slice(0, 180),
          enlace: datos.enlace ?? "/panel/actividad",
          etiqueta: `actividad-${Number(fila.meta.last_row_id)}`,
        },
        datos.usuarioId,
      );
    }
  } catch (error) {
    console.error("Proinshop: no se pudo anotar la actividad", error);
  }
}
