import type { D1Database } from "@cloudflare/workers-types";

/**
 * Las tablas y columnas que el sistema necesita y que la base de producción
 * todavía puede no tener.
 *
 * No hay token para aplicar migraciones a mano, así que la propia app las
 * crea la primera vez que arranca. Todo es idempotente: si ya existen, no se
 * toca nada. La copia escrita de lo mismo está en db/migraciones/005.
 */

const TABLAS = [
  // Cómo se pagó cada venta. Una venta mixta tiene varias filas.
  `CREATE TABLE IF NOT EXISTS venta_pago (
     id       INTEGER PRIMARY KEY AUTOINCREMENT,
     venta_id INTEGER NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
     metodo   TEXT    NOT NULL,
     monto    REAL    NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_venta_pago_venta ON venta_pago(venta_id)`,
  // Caja: se abre con un monto, se cierra contando el efectivo.
  `CREATE TABLE IF NOT EXISTS caja (
     id                INTEGER PRIMARY KEY AUTOINCREMENT,
     abierta_en        TEXT    NOT NULL DEFAULT (datetime('now')),
     abierta_por       INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
     monto_inicial     REAL    NOT NULL DEFAULT 0,
     cerrada_en        TEXT,
     cerrada_por       INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
     efectivo_esperado REAL,
     efectivo_contado  REAL,
     diferencia        REAL,
     nota              TEXT
   )`,
  // Conteo de inventario: lo que había en la bodega contra lo registrado.
  `CREATE TABLE IF NOT EXISTS conteo (
     id               INTEGER PRIMARY KEY AUTOINCREMENT,
     fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
     usuario_id       INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
     productos        INTEGER NOT NULL DEFAULT 0,
     diferencias      INTEGER NOT NULL DEFAULT 0,
     valor_diferencia REAL    NOT NULL DEFAULT 0,
     nota             TEXT
   )`,
  // Lo que hace cada persona del equipo, para que el dueño lo vea al momento.
  `CREATE TABLE IF NOT EXISTS actividad (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     fecha      TEXT    NOT NULL DEFAULT (datetime('now')),
     usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
     tipo       TEXT    NOT NULL,
     detalle    TEXT    NOT NULL,
     monto      REAL,
     enlace     TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad(fecha)`,
  // Llaves de acceso (huella o cara). Solo se guarda la llave pública: la
  // privada nunca sale del celular o la computadora de la persona.
  `CREATE TABLE IF NOT EXISTS llave_acceso (
     id            TEXT    PRIMARY KEY,
     usuario_id    INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
     clave_publica TEXT    NOT NULL,
     contador      INTEGER NOT NULL DEFAULT 0,
     transportes   TEXT,
     nombre        TEXT    NOT NULL,
     creada        TEXT    NOT NULL DEFAULT (datetime('now')),
     ultimo_uso    TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_llave_usuario ON llave_acceso(usuario_id)`,
  // El reto de cada intento: se usa una sola vez y vence a los cinco minutos.
  `CREATE TABLE IF NOT EXISTS reto_llave (
     id         TEXT    PRIMARY KEY,
     reto       TEXT    NOT NULL,
     usuario_id INTEGER,
     expira     TEXT    NOT NULL
   )`,
];

/** [tabla, columna, definición] */
const COLUMNAS: [string, string, string][] = [
  ["venta", "nota", "TEXT"],
  ["venta", "anulada", "INTEGER NOT NULL DEFAULT 0"],
  ["producto", "es_servicio", "INTEGER NOT NULL DEFAULT 0"],
  ["negocio", "umbral_stock", "INTEGER NOT NULL DEFAULT 3"],
  ["negocio", "moneda2", "TEXT"],
  ["negocio", "tasa2", "REAL"],
  ["usuario", "permisos", "TEXT"],
  ["compra", "metodo_pago", "TEXT"],
  ["cliente", "nota", "TEXT"],
  ["venta", "clave", "TEXT"],
];

/** Lo que necesita que las columnas de arriba ya existan. */
const DESPUES = [
  // Una venta reenviada (sin señal, doble toque) no se guarda dos veces.
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_venta_clave ON venta(clave)`,
];

let listo: Promise<void> | null = null;

async function aplicar(db: D1Database) {
  await db.batch(TABLAS.map((sql) => db.prepare(sql)));

  const tablas = [...new Set(COLUMNAS.map(([tabla]) => tabla))];
  for (const tabla of tablas) {
    const { results } = await db
      .prepare(`PRAGMA table_info(${tabla})`)
      .all<{ name: string }>();
    const existentes = new Set(results.map((columna) => columna.name));
    for (const [deTabla, columna, definicion] of COLUMNAS) {
      if (deTabla !== tabla || existentes.has(columna)) continue;
      try {
        await db.prepare(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`).run();
      } catch (error) {
        // Dos peticiones a la vez pueden intentar lo mismo: si ya existe, bien.
        if (!String(error).includes("duplicate column")) throw error;
      }
    }
  }

  await db.batch(DESPUES.map((sql) => db.prepare(sql)));

  // Las ventas de antes de que existiera el pago mixto pasan a tener su fila
  // de pago, así los reportes por método cuentan todo con una sola regla.
  await db
    .prepare(
      `INSERT INTO venta_pago (venta_id, metodo, monto)
       SELECT v.id, v.metodo_pago, v.total FROM venta v
       WHERE NOT EXISTS (SELECT 1 FROM venta_pago p WHERE p.venta_id = v.id)`,
    )
    .run();
}

/** Se aplica una vez por proceso; si falla, se vuelve a intentar en la siguiente. */
export function asegurarEsquema(db: D1Database): Promise<void> {
  if (!listo) {
    listo = aplicar(db).catch((error) => {
      listo = null;
      console.error("Proinshop: no se pudo poner al día la base", error);
    });
  }
  return listo;
}
