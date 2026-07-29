"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { baseDeDatos, bucket } from "@/lib/d1";
import { usuarioActual } from "@/lib/sesion";

export type ResultadoProducto = { error?: string };

const TAMANO_MAXIMO_FOTO = 15 * 1024 * 1024;

/** Convierte "Planta eléctrica 3.5 kW" en "planta-electrica-3-5-kw". */
function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function aNumero(valor: FormDataEntryValue | null): number {
  const limpio = String(valor ?? "").replace(/[^0-9.,-]/g, "").replace(",", ".");
  const numero = Number.parseFloat(limpio);
  return Number.isFinite(numero) ? numero : 0;
}

/** Guarda la foto en el bucket y devuelve su clave. */
async function guardarFoto(archivo: File, slug: string): Promise<string | null> {
  if (!archivo || archivo.size === 0) return null;
  if (archivo.size > TAMANO_MAXIMO_FOTO) throw new Error("La foto pesa más de 15 MB");

  const almacen = await bucket();
  if (!almacen) throw new Error("El almacenamiento no está disponible");

  const extension = (archivo.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  // El nombre lleva marca de tiempo: si se reemplaza la foto, la vieja no
  // queda cacheada en el navegador de los clientes.
  const clave = `productos/${slug}-${Date.now()}.${extension}`;

  await almacen.put(clave, await archivo.arrayBuffer(), {
    httpMetadata: { contentType: archivo.type || "image/jpeg" },
  });

  return clave;
}

export async function crearProducto(
  _previo: ResultadoProducto,
  datos: FormData,
): Promise<ResultadoProducto> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Escribe el nombre del producto" };

  const precio = aNumero(datos.get("precio"));
  if (precio <= 0) return { error: "El precio debe ser mayor que cero" };

  const nombreIngles = String(datos.get("nombre_en") ?? "").trim();
  const costo = aNumero(datos.get("costo"));
  const stock = Math.max(0, Math.round(aNumero(datos.get("stock"))));
  const categoriaId = Number(datos.get("categoria_id")) || null;
  const codigoBarras = String(datos.get("codigo_barras") ?? "").trim() || null;
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  const publicado = datos.get("publicado") === "on" ? 1 : 0;

  // Slug único: si ya existe uno igual, se le añade un número.
  const base = aSlug(nombre) || "producto";
  let slug = base;
  for (let intento = 2; intento < 50; intento += 1) {
    const existe = await db
      .prepare("SELECT id FROM producto WHERE slug = ?")
      .bind(slug)
      .first<{ id: number }>();
    if (!existe) break;
    slug = `${base}-${intento}`;
  }

  let claveFoto: string | null = null;
  try {
    claveFoto = await guardarFoto(datos.get("foto") as File, slug);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la foto" };
  }

  const insertado = await db
    .prepare(
      `INSERT INTO producto
         (categoria_id, slug, nombre_es, nombre_en, descripcion_es, sku, codigo_barras,
          costo, precio, stock, publicado, destacado, emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '📦')`,
    )
    .bind(
      categoriaId,
      slug,
      nombre,
      nombreIngles || null,
      descripcion,
      String(datos.get("sku") ?? "").trim() || null,
      codigoBarras,
      costo,
      precio,
      stock,
      publicado,
    )
    .run();

  const productoId = Number(insertado.meta.last_row_id);

  if (claveFoto) {
    await db
      .prepare("INSERT INTO foto (producto_id, clave_r2, clave_r2_web, orden) VALUES (?, ?, ?, 0)")
      .bind(productoId, claveFoto, claveFoto)
      .run();
  }

  if (stock > 0) {
    await db
      .prepare(
        `INSERT INTO movimiento_inventario
           (producto_id, motivo, cantidad, stock_final, usuario_id, nota)
         VALUES (?, 'alta', ?, ?, ?, 'Carga inicial del producto')`,
      )
      .bind(productoId, stock, stock, usuario.id)
      .run();
  }

  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect(`/panel/inventario/${productoId}?nuevo=1`);
}

export async function actualizarProducto(
  _previo: ResultadoProducto,
  datos: FormData,
): Promise<ResultadoProducto> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const id = Number(datos.get("id"));
  if (!id) return { error: "Producto no encontrado" };

  const actual = await db
    .prepare("SELECT slug, stock FROM producto WHERE id = ?")
    .bind(id)
    .first<{ slug: string; stock: number }>();
  if (!actual) return { error: "Producto no encontrado" };

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Escribe el nombre del producto" };

  const precio = aNumero(datos.get("precio"));
  if (precio <= 0) return { error: "El precio debe ser mayor que cero" };

  const stock = Math.max(0, Math.round(aNumero(datos.get("stock"))));

  let claveFoto: string | null = null;
  try {
    claveFoto = await guardarFoto(datos.get("foto") as File, actual.slug);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la foto" };
  }

  await db
    .prepare(
      `UPDATE producto SET
         categoria_id = ?, nombre_es = ?, nombre_en = ?, descripcion_es = ?,
         sku = ?, codigo_barras = ?, costo = ?, precio = ?, stock = ?, publicado = ?
       WHERE id = ?`,
    )
    .bind(
      Number(datos.get("categoria_id")) || null,
      nombre,
      String(datos.get("nombre_en") ?? "").trim() || null,
      String(datos.get("descripcion") ?? "").trim() || null,
      String(datos.get("sku") ?? "").trim() || null,
      String(datos.get("codigo_barras") ?? "").trim() || null,
      aNumero(datos.get("costo")),
      precio,
      stock,
      datos.get("publicado") === "on" ? 1 : 0,
      id,
    )
    .run();

  if (claveFoto) {
    await db
      .prepare("INSERT INTO foto (producto_id, clave_r2, clave_r2_web, orden) VALUES (?, ?, ?, 0)")
      .bind(id, claveFoto, claveFoto)
      .run();
  }

  // El ajuste manual de stock queda anotado igual que una venta o una compra.
  const diferencia = stock - actual.stock;
  if (diferencia !== 0) {
    await db
      .prepare(
        `INSERT INTO movimiento_inventario
           (producto_id, motivo, cantidad, stock_final, usuario_id, nota)
         VALUES (?, 'ajuste', ?, ?, ?, 'Ajuste desde el panel')`,
      )
      .bind(id, diferencia, stock, usuario.id)
      .run();
  }

  revalidatePath("/panel/inventario");
  revalidatePath(`/panel/inventario/${id}`);
  revalidatePath("/");
  return {};
}

export async function alternarPublicado(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  if (!id) return;

  await db.prepare("UPDATE producto SET publicado = 1 - publicado WHERE id = ?").bind(id).run();

  revalidatePath("/panel/inventario");
  revalidatePath("/");
}

export async function crearCategoria(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return;

  const orden = await db
    .prepare("SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM categoria")
    .first<{ siguiente: number }>();

  await db
    .prepare(
      `INSERT OR IGNORE INTO categoria (slug, nombre_es, emoji, orden, visible)
       VALUES (?, ?, '📦', ?, 1)`,
    )
    .bind(aSlug(nombre), nombre, orden?.siguiente ?? 1)
    .run();

  revalidatePath("/panel/inventario");
  revalidatePath("/");
}
