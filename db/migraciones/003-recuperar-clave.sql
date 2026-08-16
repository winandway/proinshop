-- Recuperación de contraseña sin correo saliente.
--
-- Todavía no mandamos correos, así que el propietario genera un enlace de
-- recuperación desde Equipo y se lo pasa a la persona. Para el propietario
-- mismo, el enlace se genera con el token de la base (herramienta de soporte).

CREATE TABLE IF NOT EXISTS recuperacion (
  codigo     TEXT    PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  expira     TEXT    NOT NULL,
  usada      INTEGER NOT NULL DEFAULT 0,
  creada_en  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recuperacion_usuario ON recuperacion(usuario_id);
