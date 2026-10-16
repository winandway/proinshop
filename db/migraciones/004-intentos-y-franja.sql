-- Freno a la fuerza bruta y franja de estado del trabajo.
--
-- Las dos tablas también se crean solas desde el código (CREATE TABLE IF NOT
-- EXISTS) para no depender de que alguien aplique esta migración a mano.

-- Cada contraseña equivocada en la entrada del panel. Pasado el límite por
-- correo o por conexión, se pide esperar 15 minutos.
CREATE TABLE IF NOT EXISTS intento_acceso (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  correo   TEXT NOT NULL,
  conexion TEXT NOT NULL,
  fecha    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- La franja que ve el dueño arriba de su panel mientras trabajamos.
-- Tres tiempos: en_proceso → terminado (le toca probar) → apagada (activo = 0).
-- Se apaga, no se borra: queda el registro.
CREATE TABLE IF NOT EXISTS trabajo_en_proceso (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  trabajo        TEXT    NOT NULL,
  estado         TEXT    NOT NULL DEFAULT 'en_proceso'
                 CHECK (estado IN ('en_proceso', 'terminado')),
  activo         INTEGER NOT NULL DEFAULT 1,
  creado_en      TEXT    NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT    NOT NULL DEFAULT (datetime('now'))
);
