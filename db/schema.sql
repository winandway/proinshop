-- Esquema de la base de datos de Proinshop (D1 / SQLite).
--
-- Se aplica en la Etapa 3, cuando el dueño autorice crear la base en la nube.
-- Todo texto de cara al público tiene su columna en español y en inglés.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- negocio
CREATE TABLE IF NOT EXISTS negocio (
  id              INTEGER PRIMARY KEY,
  nombre          TEXT    NOT NULL,
  dominio         TEXT    NOT NULL,
  whatsapp        TEXT,
  correo          TEXT,
  direccion       TEXT,
  moneda          TEXT    NOT NULL DEFAULT 'USD',
  costo_envio     REAL    NOT NULL DEFAULT 0,
  mostrar_stock   INTEGER NOT NULL DEFAULT 1,
  ocultar_agotados INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS usuario (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  negocio_id  INTEGER NOT NULL REFERENCES negocio(id) ON DELETE CASCADE,
  nombre      TEXT    NOT NULL,
  rol         TEXT    NOT NULL CHECK (rol IN ('dueno', 'vendedor', 'bodega')),
  pin_hash    TEXT    NOT NULL,
  activo      INTEGER NOT NULL DEFAULT 1,
  creado_en   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- --------------------------------------------------------------- catálogo
CREATE TABLE IF NOT EXISTS categoria (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL UNIQUE,
  nombre_es  TEXT    NOT NULL,
  nombre_en  TEXT,
  emoji      TEXT,
  orden      INTEGER NOT NULL DEFAULT 0,
  visible    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS producto (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria_id    INTEGER REFERENCES categoria(id) ON DELETE SET NULL,
  slug            TEXT    NOT NULL UNIQUE,
  nombre_es       TEXT    NOT NULL,
  nombre_en       TEXT,
  descripcion_es  TEXT,
  descripcion_en  TEXT,
  sku             TEXT,
  codigo_barras   TEXT,
  costo           REAL    NOT NULL DEFAULT 0,
  precio          REAL    NOT NULL DEFAULT 0,
  precio_anterior REAL,
  stock           INTEGER NOT NULL DEFAULT 0,
  stock_minimo    INTEGER NOT NULL DEFAULT 0,
  publicado       INTEGER NOT NULL DEFAULT 1,
  destacado       INTEGER NOT NULL DEFAULT 0,
  creado_por_ia   INTEGER NOT NULL DEFAULT 0,
  creado_en       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto(categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_publicado ON producto(publicado, destacado);
CREATE INDEX IF NOT EXISTS idx_producto_codigo ON producto(codigo_barras);

CREATE TABLE IF NOT EXISTS variante (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id  INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  nombre_es    TEXT    NOT NULL,
  nombre_en    TEXT,
  sku          TEXT,
  stock        INTEGER NOT NULL DEFAULT 0,
  precio_extra REAL    NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS foto (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id   INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  clave_r2      TEXT    NOT NULL,   -- foto tal como la tomó el celular
  clave_r2_web  TEXT,               -- versión optimizada, con el fondo recortado
  orden         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS especificacion (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  etiqueta_es TEXT    NOT NULL,
  etiqueta_en TEXT,
  valor_es    TEXT    NOT NULL,
  valor_en    TEXT,
  orden       INTEGER NOT NULL DEFAULT 0
);

-- --------------------------------------------------- personas del negocio
CREATE TABLE IF NOT EXISTS cliente (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT    NOT NULL,
  telefono   TEXT,
  correo     TEXT,
  direccion  TEXT,
  creado_en  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS proveedor (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT    NOT NULL,
  telefono  TEXT,
  correo    TEXT,
  notas     TEXT
);

-- ------------------------------------------------------------ movimientos
CREATE TABLE IF NOT EXISTS venta (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha       TEXT    NOT NULL DEFAULT (datetime('now')),
  canal       TEXT    NOT NULL CHECK (canal IN ('local', 'web')),
  cliente_id  INTEGER REFERENCES cliente(id) ON DELETE SET NULL,
  usuario_id  INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  metodo_pago TEXT    NOT NULL,
  subtotal    REAL    NOT NULL DEFAULT 0,
  descuento   REAL    NOT NULL DEFAULT 0,
  total       REAL    NOT NULL DEFAULT 0,
  pagada      INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta(fecha);

CREATE TABLE IF NOT EXISTS venta_item (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id     INTEGER NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
  producto_id  INTEGER REFERENCES producto(id) ON DELETE SET NULL,
  variante_id  INTEGER REFERENCES variante(id) ON DELETE SET NULL,
  descripcion  TEXT    NOT NULL,   -- se guarda el nombre del momento de la venta
  cantidad     INTEGER NOT NULL,
  precio_unit  REAL    NOT NULL,
  costo_unit   REAL    NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gasto (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha        TEXT    NOT NULL DEFAULT (datetime('now')),
  categoria    TEXT    NOT NULL,
  proveedor_id INTEGER REFERENCES proveedor(id) ON DELETE SET NULL,
  monto        REAL    NOT NULL,
  metodo_pago  TEXT,
  nota         TEXT,
  recibo_r2    TEXT
);

CREATE INDEX IF NOT EXISTS idx_gasto_fecha ON gasto(fecha);

-- -------------------------------------------------------- cuentas por cobrar
CREATE TABLE IF NOT EXISTS deuda (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
  venta_id   INTEGER REFERENCES venta(id) ON DELETE SET NULL,
  monto      REAL    NOT NULL,
  saldo      REAL    NOT NULL,
  vence      TEXT,
  creado_en  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS abono (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  deuda_id    INTEGER NOT NULL REFERENCES deuda(id) ON DELETE CASCADE,
  fecha       TEXT    NOT NULL DEFAULT (datetime('now')),
  monto       REAL    NOT NULL,
  metodo_pago TEXT
);

-- ------------------------------------------------------------ cotizaciones
CREATE TABLE IF NOT EXISTS cotizacion (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id    INTEGER REFERENCES cliente(id) ON DELETE SET NULL,
  estado        TEXT    NOT NULL DEFAULT 'enviada'
                CHECK (estado IN ('borrador', 'enviada', 'aceptada', 'vencida')),
  total         REAL    NOT NULL DEFAULT 0,
  vence         TEXT,
  token_publico TEXT    UNIQUE,   -- para que el cliente la abra sin cuenta
  venta_id      INTEGER REFERENCES venta(id) ON DELETE SET NULL,
  creado_en     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cotizacion_item (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cotizacion_id INTEGER NOT NULL REFERENCES cotizacion(id) ON DELETE CASCADE,
  producto_id   INTEGER REFERENCES producto(id) ON DELETE SET NULL,
  descripcion   TEXT    NOT NULL,
  cantidad      INTEGER NOT NULL,
  precio_unit   REAL    NOT NULL
);

-- ---------------------------------------------------- pedidos de la tienda
CREATE TABLE IF NOT EXISTS pedido (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  numero           TEXT    NOT NULL UNIQUE,
  fecha            TEXT    NOT NULL DEFAULT (datetime('now')),
  estado           TEXT    NOT NULL DEFAULT 'nuevo'
                   CHECK (estado IN ('nuevo', 'preparando', 'enviado', 'entregado', 'cancelado')),
  cliente_nombre   TEXT    NOT NULL,
  cliente_telefono TEXT    NOT NULL,
  cliente_correo   TEXT,
  direccion        TEXT,
  entrega          TEXT    NOT NULL CHECK (entrega IN ('domicilio', 'local')),
  metodo_pago      TEXT    NOT NULL,
  subtotal         REAL    NOT NULL DEFAULT 0,
  envio            REAL    NOT NULL DEFAULT 0,
  total            REAL    NOT NULL DEFAULT 0,
  venta_id         INTEGER REFERENCES venta(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estado, fecha);

CREATE TABLE IF NOT EXISTS pedido_item (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id   INTEGER NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES producto(id) ON DELETE SET NULL,
  variante_id INTEGER REFERENCES variante(id) ON DELETE SET NULL,
  descripcion TEXT    NOT NULL,
  cantidad    INTEGER NOT NULL,
  precio_unit REAL    NOT NULL
);
