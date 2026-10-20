-- Igualar con Treinta (19 oct 2026). Copia escrita de lo que crea solo
-- src/lib/esquema.ts al arrancar; no hace falta aplicarla a mano.

CREATE TABLE IF NOT EXISTS venta_pago (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
  metodo   TEXT    NOT NULL,
  monto    REAL    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_venta_pago_venta ON venta_pago(venta_id);

CREATE TABLE IF NOT EXISTS caja (
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
);

CREATE TABLE IF NOT EXISTS conteo (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
  usuario_id       INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  productos        INTEGER NOT NULL DEFAULT 0,
  diferencias      INTEGER NOT NULL DEFAULT 0,
  valor_diferencia REAL    NOT NULL DEFAULT 0,
  nota             TEXT
);

CREATE TABLE IF NOT EXISTS actividad (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha      TEXT    NOT NULL DEFAULT (datetime('now')),
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  tipo       TEXT    NOT NULL,
  detalle    TEXT    NOT NULL,
  monto      REAL,
  enlace     TEXT
);
CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON actividad(fecha);

ALTER TABLE venta    ADD COLUMN nota TEXT;
ALTER TABLE venta    ADD COLUMN anulada INTEGER NOT NULL DEFAULT 0;
ALTER TABLE producto ADD COLUMN es_servicio INTEGER NOT NULL DEFAULT 0;
ALTER TABLE negocio  ADD COLUMN umbral_stock INTEGER NOT NULL DEFAULT 3;
ALTER TABLE negocio  ADD COLUMN moneda2 TEXT;
ALTER TABLE negocio  ADD COLUMN tasa2 REAL;
ALTER TABLE usuario  ADD COLUMN permisos TEXT;
ALTER TABLE compra   ADD COLUMN metodo_pago TEXT;
ALTER TABLE cliente  ADD COLUMN nota TEXT;

-- Llaves de acceso (entrar con huella o cara).
CREATE TABLE IF NOT EXISTS llave_acceso (
  id            TEXT    PRIMARY KEY,
  usuario_id    INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  clave_publica TEXT    NOT NULL,
  contador      INTEGER NOT NULL DEFAULT 0,
  transportes   TEXT,
  nombre        TEXT    NOT NULL,
  creada        TEXT    NOT NULL DEFAULT (datetime('now')),
  ultimo_uso    TEXT
);
CREATE INDEX IF NOT EXISTS idx_llave_usuario ON llave_acceso(usuario_id);

CREATE TABLE IF NOT EXISTS reto_llave (
  id         TEXT    PRIMARY KEY,
  reto       TEXT    NOT NULL,
  usuario_id INTEGER,
  expira     TEXT    NOT NULL
);

-- Llave única de cada venta: la cola de ventas hechas sin señal puede
-- reenviar la misma venta y solo debe quedar una.
ALTER TABLE venta ADD COLUMN clave TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_venta_clave ON venta(clave);
