-- Autenticación del panel de administración.
--
-- La tabla `usuario` nació pensada para un PIN. Ahora necesita correo y
-- contraseña, porque el dueño entra desde el celular y desde el computador.
-- SQLite no permite añadir columnas UNIQUE con ALTER TABLE: el correo único
-- se garantiza con un índice aparte.

ALTER TABLE usuario ADD COLUMN correo TEXT;
ALTER TABLE usuario ADD COLUMN contrasena_hash TEXT;
ALTER TABLE usuario ADD COLUMN sal TEXT;
ALTER TABLE usuario ADD COLUMN ultimo_acceso TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_correo ON usuario(correo)
  WHERE correo IS NOT NULL;

-- Una fila por sesión abierta. El identificador es el valor aleatorio que
-- viaja en la cookie; guardar la sesión en la base permite cerrarla desde
-- cualquier dispositivo, cosa que una cookie firmada sola no permite.
CREATE TABLE IF NOT EXISTS sesion (
  id            TEXT    PRIMARY KEY,
  usuario_id    INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  expira        TEXT    NOT NULL,
  creado_en     TEXT    NOT NULL DEFAULT (datetime('now')),
  ultimo_uso    TEXT    NOT NULL DEFAULT (datetime('now')),
  agente        TEXT
);

CREATE INDEX IF NOT EXISTS idx_sesion_usuario ON sesion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesion_expira ON sesion(expira);

-- Invitaciones: el dueño crea el enlace y el empleado elige su contraseña.
-- Así nadie se registra por su cuenta en el panel del negocio.
CREATE TABLE IF NOT EXISTS invitacion (
  codigo     TEXT    PRIMARY KEY,
  negocio_id INTEGER NOT NULL REFERENCES negocio(id) ON DELETE CASCADE,
  nombre     TEXT,
  rol        TEXT    NOT NULL CHECK (rol IN ('dueno', 'vendedor', 'bodega')),
  expira     TEXT    NOT NULL,
  usada      INTEGER NOT NULL DEFAULT 0,
  creada_por INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  creada_en  TEXT    NOT NULL DEFAULT (datetime('now'))
);
