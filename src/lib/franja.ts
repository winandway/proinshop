import { baseDeDatos } from "./d1";

/**
 * La franja de estado del trabajo.
 *
 * El dueño del negocio ve arriba de su panel en qué estamos trabajando. Nunca
 * se le dice "ya está listo" por nuestra cuenta: el salto de "en proceso" a
 * "terminado" lo decide quien paga el trabajo, después de probarlo. Por eso
 * vive en la base y se cambia desde la pantalla de Soporte, sin publicar la
 * app otra vez. Al apagarla no se borra: queda el registro.
 */

export type EstadoFranja = "en_proceso" | "terminado";

export type Franja = {
  id: number;
  trabajo: string;
  estado: EstadoFranja;
};

/** Lo que se está construyendo al entregar esta primera versión. */
const TRABAJO_INICIAL =
  "la carga de productos con una foto, las compras a proveedores, el banner de la portada y el manual de uso";

async function asegurarTabla() {
  const db = await baseDeDatos();
  if (!db) return null;

  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS trabajo_en_proceso (
         id             INTEGER PRIMARY KEY AUTOINCREMENT,
         trabajo        TEXT    NOT NULL,
         estado         TEXT    NOT NULL DEFAULT 'en_proceso'
                        CHECK (estado IN ('en_proceso', 'terminado')),
         activo         INTEGER NOT NULL DEFAULT 1,
         creado_en      TEXT    NOT NULL DEFAULT (datetime('now')),
         actualizado_en TEXT    NOT NULL DEFAULT (datetime('now'))
       )`,
    ),
    // Solo la primera vez: si ya hubo alguna franja, no se vuelve a sembrar.
    db
      .prepare(
        `INSERT INTO trabajo_en_proceso (trabajo)
         SELECT ? WHERE NOT EXISTS (SELECT 1 FROM trabajo_en_proceso)`,
      )
      .bind(TRABAJO_INICIAL),
  ]);

  return db;
}

export async function franjaActiva(): Promise<Franja | null> {
  const db = await asegurarTabla().catch(() => null);
  if (!db) return null;

  const fila = await db
    .prepare(
      `SELECT id, trabajo, estado FROM trabajo_en_proceso
       WHERE activo = 1 ORDER BY id DESC LIMIT 1`,
    )
    .first<{ id: number; trabajo: string; estado: string }>()
    .catch(() => null);

  if (!fila) return null;
  return {
    id: fila.id,
    trabajo: fila.trabajo,
    estado: fila.estado === "terminado" ? "terminado" : "en_proceso",
  };
}

export async function guardarFranja(datos: {
  trabajo: string;
  estado: EstadoFranja;
  activa: boolean;
}): Promise<void> {
  const db = await asegurarTabla();
  if (!db) return;

  if (!datos.activa) {
    await db
      .prepare(
        "UPDATE trabajo_en_proceso SET activo = 0, actualizado_en = datetime('now') WHERE activo = 1",
      )
      .run();
    return;
  }

  const actual = await franjaActiva();
  if (actual) {
    await db
      .prepare(
        `UPDATE trabajo_en_proceso
         SET trabajo = ?, estado = ?, actualizado_en = datetime('now') WHERE id = ?`,
      )
      .bind(datos.trabajo, datos.estado, actual.id)
      .run();
  } else {
    await db
      .prepare("INSERT INTO trabajo_en_proceso (trabajo, estado) VALUES (?, ?)")
      .bind(datos.trabajo, datos.estado)
      .run();
  }
}
