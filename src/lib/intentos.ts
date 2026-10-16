import type { D1Database } from "@cloudflare/workers-types";

/**
 * Freno a la fuerza bruta en la entrada del panel.
 *
 * Cada contraseña equivocada queda anotada por correo y por conexión. Pasado
 * el límite, se dice que espere, sin mirar siquiera la contraseña: así nadie
 * puede probar miles de claves contra la cuenta del dueño.
 *
 * La tabla se crea sola: no depende de que la migración se haya aplicado.
 */

const MINUTOS = 15;
const MAXIMO_POR_CORREO = 5;
const MAXIMO_POR_CONEXION = 20;

export const AVISO_DEMASIADOS = `Demasiados intentos. Espera ${MINUTOS} minutos y vuelve a probar.`;

async function asegurarTabla(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS intento_acceso (
         id       INTEGER PRIMARY KEY AUTOINCREMENT,
         correo   TEXT NOT NULL,
         conexion TEXT NOT NULL,
         fecha    TEXT NOT NULL DEFAULT (datetime('now'))
       )`,
    )
    .run();
}

export async function estaBloqueado(
  db: D1Database,
  correo: string,
  conexion: string,
): Promise<boolean> {
  await asegurarTabla(db);
  const fila = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM intento_acceso
          WHERE correo = ? AND fecha > datetime('now', ?)) AS por_correo,
         (SELECT COUNT(*) FROM intento_acceso
          WHERE conexion = ? AND fecha > datetime('now', ?)) AS por_conexion`,
    )
    .bind(correo, `-${MINUTOS} minutes`, conexion, `-${MINUTOS} minutes`)
    .first<{ por_correo: number; por_conexion: number }>();

  return (
    (fila?.por_correo ?? 0) >= MAXIMO_POR_CORREO ||
    (fila?.por_conexion ?? 0) >= MAXIMO_POR_CONEXION
  );
}

export async function anotarFallo(db: D1Database, correo: string, conexion: string) {
  await asegurarTabla(db);
  await db.batch([
    db.prepare("INSERT INTO intento_acceso (correo, conexion) VALUES (?, ?)").bind(correo, conexion),
    // Lo viejo no sirve para nada: se limpia de paso para que la tabla no crezca.
    db.prepare("DELETE FROM intento_acceso WHERE fecha < datetime('now', '-1 day')"),
  ]);
}

export async function limpiarFallos(db: D1Database, correo: string) {
  await asegurarTabla(db);
  await db.prepare("DELETE FROM intento_acceso WHERE correo = ?").bind(correo).run();
}
