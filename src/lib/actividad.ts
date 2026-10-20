import { baseDeDatos } from "./d1";

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
    await db
      .prepare(
        "INSERT INTO actividad (usuario_id, tipo, detalle, monto, enlace) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(datos.usuarioId, datos.tipo, datos.detalle.slice(0, 200), datos.monto ?? null, datos.enlace ?? null)
      .run();
  } catch (error) {
    console.error("Proinshop: no se pudo anotar la actividad", error);
  }
}
