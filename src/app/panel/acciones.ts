"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { baseDeDatos } from "@/lib/d1";
import {
  cifrarContrasena,
  correoValido,
  nuevaSal,
  revisarContrasena,
  revisarNombreDeSoporte,
  verificarContrasena,
} from "@/lib/contrasenas";
import { cerrarSesion, crearSesion, hayUsuarios } from "@/lib/sesion";

export type Resultado = { error?: string };

/**
 * Crea la cuenta del propietario.
 *
 * Solo funciona mientras no exista ningún usuario: es el arranque del panel.
 * Después, las cuentas se crean por invitación desde dentro — si no, cualquiera
 * podría registrarse y entrar a las cuentas del negocio.
 */
export async function crearCuenta(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  if (await hayUsuarios()) {
    return { error: "El panel ya tiene una cuenta. Pídele al propietario que te invite." };
  }

  const nombre = String(datos.get("nombre") ?? "").trim();
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const repetida = String(datos.get("repetida") ?? "");

  if (nombre.length < 2) return { error: "Escribe tu nombre" };
  if (!correoValido(correo)) return { error: "El correo electrónico no es válido" };
  if (contrasena !== repetida) return { error: "Las dos contraseñas no coinciden" };

  const nombreSoporte = revisarNombreDeSoporte(nombre, correo);
  if (nombreSoporte) return { error: nombreSoporte };

  const problema = revisarContrasena(contrasena);
  if (problema) return { error: problema };

  const sal = nuevaSal();
  const hash = await cifrarContrasena(contrasena, sal);

  // El negocio puede no existir todavía si la base se creó vacía.
  await db
    .prepare(
      `INSERT OR IGNORE INTO negocio (id, nombre, dominio, moneda, costo_envio)
       VALUES (1, 'Proinshop', 'proinshop.com', 'USD', 25)`,
    )
    .run();

  const insertado = await db
    .prepare(
      `INSERT INTO usuario (negocio_id, nombre, rol, pin_hash, correo, contrasena_hash, sal, activo)
       VALUES (1, ?, 'dueno', '', ?, ?, ?, 1)`,
    )
    .bind(nombre, correo, hash, sal)
    .run();

  const usuarioId = Number(insertado.meta.last_row_id);
  const agente = (await headers()).get("user-agent") ?? undefined;
  await crearSesion(usuarioId, agente);

  redirect("/panel");
}

export async function entrar(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");

  if (!correo || !contrasena) return { error: "Escribe tu correo y tu contraseña" };

  const usuario = await db
    .prepare(
      `SELECT id, contrasena_hash, sal, activo FROM usuario
       WHERE correo = ? AND contrasena_hash IS NOT NULL`,
    )
    .bind(correo)
    .first<{ id: number; contrasena_hash: string; sal: string; activo: number }>();

  // Mismo mensaje exista o no el correo: decir cuál de los dos falló le
  // regalaría a un atacante la lista de correos registrados.
  const generico = { error: "Correo o contraseña incorrectos" };
  if (!usuario) return generico;

  const correcta = await verificarContrasena(contrasena, usuario.sal, usuario.contrasena_hash);
  if (!correcta) return generico;
  if (usuario.activo !== 1) return { error: "Esta cuenta está desactivada" };

  await db
    .prepare("UPDATE usuario SET ultimo_acceso = datetime('now') WHERE id = ?")
    .bind(usuario.id)
    .run();

  const agente = (await headers()).get("user-agent") ?? undefined;
  await crearSesion(usuario.id, agente);

  redirect("/panel");
}

/** Alta de un empleado con el código que le pasó el propietario. */
export async function aceptarInvitacion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const codigo = String(datos.get("codigo") ?? "").trim();
  const nombre = String(datos.get("nombre") ?? "").trim();
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const repetida = String(datos.get("repetida") ?? "");

  const invitacion = await db
    .prepare(
      `SELECT codigo, negocio_id, rol FROM invitacion
       WHERE codigo = ? AND usada = 0 AND expira > datetime('now')`,
    )
    .bind(codigo)
    .first<{ codigo: string; negocio_id: number; rol: string }>();

  if (!invitacion) return { error: "La invitación no existe, ya se usó o venció" };
  if (nombre.length < 2) return { error: "Escribe tu nombre" };
  if (!correoValido(correo)) return { error: "El correo electrónico no es válido" };
  if (contrasena !== repetida) return { error: "Las dos contraseñas no coinciden" };

  const nombreSoporte = revisarNombreDeSoporte(nombre, correo);
  if (nombreSoporte) return { error: nombreSoporte };

  const problema = revisarContrasena(contrasena);
  if (problema) return { error: problema };

  const repetido = await db
    .prepare("SELECT id FROM usuario WHERE correo = ?")
    .bind(correo)
    .first<{ id: number }>();
  if (repetido) return { error: "Ya hay una cuenta con ese correo" };

  const sal = nuevaSal();
  const hash = await cifrarContrasena(contrasena, sal);

  const insertado = await db
    .prepare(
      `INSERT INTO usuario (negocio_id, nombre, rol, pin_hash, correo, contrasena_hash, sal, activo)
       VALUES (?, ?, ?, '', ?, ?, ?, 1)`,
    )
    .bind(invitacion.negocio_id, nombre, invitacion.rol, correo, hash, sal)
    .run();

  await db.prepare("UPDATE invitacion SET usada = 1 WHERE codigo = ?").bind(codigo).run();

  const agente = (await headers()).get("user-agent") ?? undefined;
  await crearSesion(Number(insertado.meta.last_row_id), agente);

  redirect("/panel");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/panel/entrar");
}
