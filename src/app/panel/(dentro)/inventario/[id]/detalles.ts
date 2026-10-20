"use server";

import { revalidatePath } from "next/cache";
import { leerMonto } from "@/lib/numeros";
import { baseDeDatos } from "@/lib/d1";
import { usuarioQuePuede } from "@/lib/sesion";

/**
 * Variantes y especificaciones del producto.
 *
 * La tienda ya las mostraba, pero no había forma de cargarlas desde el panel:
 * solo existían en los datos de desarrollo. Sin esto, el dueño no puede vender
 * "el mismo producto en rojo y en negro" ni poner la ficha técnica.
 */

/** Igual que el resto del catálogo: propietario y bodega; el vendedor solo mira. */
async function puedeEditar(): Promise<boolean> {
  return Boolean(await usuarioQuePuede("inventario"));
}


export async function agregarVariante(datos: FormData): Promise<void> {
  if (!(await puedeEditar())) return;

  const db = await baseDeDatos();
  if (!db) return;

  const productoId = Number(datos.get("producto_id"));
  const nombre = String(datos.get("nombre") ?? "").trim();
  if (!productoId || nombre.length < 1) return;

  await db
    .prepare(
      `INSERT INTO variante (producto_id, nombre_es, nombre_en, sku, stock, precio_extra)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      productoId,
      nombre,
      String(datos.get("nombre_en") ?? "").trim() || null,
      String(datos.get("sku") ?? "").trim() || null,
      Math.max(0, Math.round(leerMonto(datos.get("stock")))),
      leerMonto(datos.get("precio_extra")),
    )
    .run();

  revalidatePath(`/panel/inventario/${productoId}`);
  revalidatePath("/");
}

export async function quitarVariante(datos: FormData): Promise<void> {
  if (!(await puedeEditar())) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const productoId = Number(datos.get("producto_id"));
  if (!id) return;

  await db.prepare("DELETE FROM variante WHERE id = ?").bind(id).run();

  revalidatePath(`/panel/inventario/${productoId}`);
  revalidatePath("/");
}

export async function agregarEspecificacion(datos: FormData): Promise<void> {
  if (!(await puedeEditar())) return;

  const db = await baseDeDatos();
  if (!db) return;

  const productoId = Number(datos.get("producto_id"));
  const etiqueta = String(datos.get("etiqueta") ?? "").trim();
  const valor = String(datos.get("valor") ?? "").trim();
  if (!productoId || !etiqueta || !valor) return;

  await db
    .prepare(
      `INSERT INTO especificacion (producto_id, etiqueta_es, etiqueta_en, valor_es, valor_en, orden)
       VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(orden) + 1, 0) FROM especificacion WHERE producto_id = ?))`,
    )
    .bind(
      productoId,
      etiqueta,
      String(datos.get("etiqueta_en") ?? "").trim() || null,
      valor,
      String(datos.get("valor_en") ?? "").trim() || null,
      productoId,
    )
    .run();

  revalidatePath(`/panel/inventario/${productoId}`);
  revalidatePath("/");
}

export async function quitarEspecificacion(datos: FormData): Promise<void> {
  if (!(await puedeEditar())) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const productoId = Number(datos.get("producto_id"));
  if (!id) return;

  await db.prepare("DELETE FROM especificacion WHERE id = ?").bind(id).run();

  revalidatePath(`/panel/inventario/${productoId}`);
  revalidatePath("/");
}
