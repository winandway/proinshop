-- Compras a proveedor, historial de stock y banner administrable.

-- Entrada de mercancía. El costo de la compra actualiza el costo del producto,
-- que es lo que hace que la ganancia real sea confiable.
CREATE TABLE IF NOT EXISTS compra (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha        TEXT    NOT NULL DEFAULT (datetime('now')),
  proveedor_id INTEGER REFERENCES proveedor(id) ON DELETE SET NULL,
  usuario_id   INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  factura      TEXT,
  total        REAL    NOT NULL DEFAULT 0,
  nota         TEXT
);

CREATE INDEX IF NOT EXISTS idx_compra_fecha ON compra(fecha);

CREATE TABLE IF NOT EXISTS compra_item (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id   INTEGER NOT NULL REFERENCES compra(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES producto(id) ON DELETE SET NULL,
  variante_id INTEGER REFERENCES variante(id) ON DELETE SET NULL,
  descripcion TEXT    NOT NULL,
  cantidad    INTEGER NOT NULL,
  costo_unit  REAL    NOT NULL
);

-- Toda entrada y salida de stock queda anotada. Sin esto, cuando un número no
-- cuadra no hay forma de saber qué pasó.
CREATE TABLE IF NOT EXISTS movimiento_inventario (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha       TEXT    NOT NULL DEFAULT (datetime('now')),
  producto_id INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
  variante_id INTEGER REFERENCES variante(id) ON DELETE SET NULL,
  motivo      TEXT    NOT NULL
              CHECK (motivo IN ('alta', 'compra', 'venta', 'pedido', 'ajuste', 'devolucion')),
  cantidad    INTEGER NOT NULL,   -- positivo entra, negativo sale
  stock_final INTEGER NOT NULL,
  usuario_id  INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  referencia  TEXT,               -- número de venta, compra o pedido
  nota        TEXT
);

CREATE INDEX IF NOT EXISTS idx_movimiento_producto ON movimiento_inventario(producto_id, fecha);

-- Mensajes del banner de la portada, editables desde el panel.
CREATE TABLE IF NOT EXISTS banner (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  encabezado_es TEXT,
  encabezado_en TEXT,
  titulo_es     TEXT    NOT NULL,
  titulo_en     TEXT,
  detalle_es    TEXT,
  detalle_en    TEXT,
  boton_es      TEXT,
  boton_en      TEXT,
  enlace        TEXT,
  emoji         TEXT,
  clave_r2      TEXT,
  orden         INTEGER NOT NULL DEFAULT 0,
  visible       INTEGER NOT NULL DEFAULT 1
);
