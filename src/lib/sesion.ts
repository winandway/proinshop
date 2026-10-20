import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { baseDeDatos } from "./d1";
import { valorAleatorio } from "./contrasenas";
import { leerPermisos, puedeUsar, type Modulo, type Permisos, type Rol } from "./permisos";

/**
 * Sesiones del panel.
 *
 * La cookie solo lleva un identificador aleatorio; los datos viven en la
 * tabla `sesion`. Así el dueño puede cerrar la sesión de un empleado aunque
 * el empleado tenga la cookie en su celular.
 */

export const COOKIE_SESION = "proinshop_sesion";
const DIAS_DE_VIDA = 30;

export type { Rol } from "./permisos";

export type UsuarioSesion = {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  negocioId: number;
  permisos: Permisos;
};

export async function crearSesion(usuarioId: number, agente?: string): Promise<string> {
  const db = await baseDeDatos();
  if (!db) throw new Error("Base de datos no disponible");

  const id = valorAleatorio(32);

  await db
    .prepare(
      `INSERT INTO sesion (id, usuario_id, expira, agente)
       VALUES (?, ?, datetime('now', ?), ?)`,
    )
    .bind(id, usuarioId, `+${DIAS_DE_VIDA} days`, agente?.slice(0, 200) ?? null)
    .run();

  const almacen = await cookies();
  almacen.set(COOKIE_SESION, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DIAS_DE_VIDA * 24 * 60 * 60,
  });

  return id;
}

/** Usuario de la sesión actual, o null si no hay sesión válida. */
export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const db = await baseDeDatos();
  if (!db) return null;

  const almacen = await cookies();
  const id = almacen.get(COOKIE_SESION)?.value;
  if (!id) return null;

  const fila = await db
    .prepare(
      `SELECT u.id, u.nombre, u.correo, u.rol, u.negocio_id, u.permisos
       FROM sesion s JOIN usuario u ON u.id = s.usuario_id
       WHERE s.id = ? AND s.expira > datetime('now') AND u.activo = 1`,
    )
    .bind(id)
    .first<{
      id: number;
      nombre: string;
      correo: string | null;
      rol: string;
      negocio_id: number;
      permisos: string | null;
    }>();

  if (!fila) return null;

  // Marca de uso: sirve para mostrar "última entrada" y para limpiar sesiones
  // abandonadas más adelante.
  await db
    .prepare("UPDATE sesion SET ultimo_uso = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo ?? "",
    rol: fila.rol as Rol,
    negocioId: fila.negocio_id,
    permisos: leerPermisos(fila.permisos),
  };
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  const id = almacen.get(COOKIE_SESION)?.value;

  if (id) {
    const db = await baseDeDatos();
    await db?.prepare("DELETE FROM sesion WHERE id = ?").bind(id).run();
  }

  almacen.delete(COOKIE_SESION);
}

/** ¿Ya hay alguien registrado? Si no, la primera cuenta es la del dueño. */
export async function hayUsuarios(): Promise<boolean> {
  const db = await baseDeDatos();
  if (!db) return true;

  const fila = await db.prepare("SELECT COUNT(*) AS total FROM usuario").first<{ total: number }>();
  return (fila?.total ?? 0) > 0;
}

/** ¿Esta persona puede usar este módulo? Rol por defecto + lo que ajustó el dueño. */
export function puede(usuario: UsuarioSesion | null, modulo: Modulo): boolean {
  return puedeUsar(usuario, modulo);
}

/**
 * Para las acciones del servidor: devuelve la persona si puede, o null. La
 * regla vive aquí y no solo en los botones, porque una acción se puede
 * llamar aunque el botón esté escondido.
 */
export async function usuarioQuePuede(modulo: Modulo): Promise<UsuarioSesion | null> {
  const usuario = await usuarioActual();
  return puede(usuario, modulo) ? usuario : null;
}

export const NOMBRE_ROL: Record<Rol, string> = {
  dueno: "Propietario",
  vendedor: "Vendedor",
  bodega: "Bodega",
};

/**
 * Para las pantallas: si no hay sesión, a entrar; si no tiene permiso, al
 * inicio con un aviso claro (nunca una pantalla en blanco ni un error).
 */
export async function exigir(modulo: Modulo): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");
  if (!puede(usuario, modulo)) redirect("/panel?sin_permiso=1");
  return usuario;
}
