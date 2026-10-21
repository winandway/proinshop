"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { leerMonto } from "@/lib/numeros";
import { anotarActividad } from "@/lib/actividad";
import { baseDeDatos, bucket } from "@/lib/d1";
import { puede, usuarioActual, usuarioQuePuede, type UsuarioSesion } from "@/lib/sesion";
import { borrarProductos } from "@/lib/borrar-productos";

export type ResultadoProducto = { error?: string; guardado?: boolean };

/**
 * Quién puede tocar el catálogo: quien tenga el módulo de inventario (por
 * defecto, propietario y bodega). La regla vive aquí, en el servidor:
 * esconder el botón no basta, porque la acción se puede llamar igual.
 */
async function editorDeCatalogo(): Promise<UsuarioSesion | null> {
  return usuarioQuePuede("inventario");
}

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
  const usuario = await editorDeCatalogo();
  if (!usuario) return { error: "Tu cuenta no tiene permiso para cargar productos" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Escribe el nombre del producto" };

  const precio = leerMonto(datos.get("precio"));
  if (precio <= 0) return { error: "El precio debe ser mayor que cero" };

  const nombreIngles = String(datos.get("nombre_en") ?? "").trim();
  const costo = puede(usuario, "costos") ? leerMonto(datos.get("costo")) : 0;
  const stock = Math.max(0, Math.round(leerMonto(datos.get("stock"))));
  const categoriaId = Number(datos.get("categoria_id")) || null;
  const codigoBarras = String(datos.get("codigo_barras") ?? "").trim() || null;
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  const descripcionIngles = String(datos.get("descripcion_en") ?? "").trim() || null;
  const publicado = datos.get("publicado") === "on" ? 1 : 0;
  const destacado = datos.get("destacado") === "on" ? 1 : 0;
  const esServicio = datos.get("es_servicio") === "on" ? 1 : 0;
  const stockMinimo = Math.max(0, Math.round(leerMonto(datos.get("stock_minimo"))));

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
         (categoria_id, slug, nombre_es, nombre_en, descripcion_es, descripcion_en, sku,
          codigo_barras, costo, precio, stock, publicado, destacado, emoji, es_servicio, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '📦', ?, ?)`,
    )
    .bind(
      categoriaId,
      slug,
      nombre,
      nombreIngles || null,
      descripcion,
      descripcionIngles,
      String(datos.get("sku") ?? "").trim() || null,
      codigoBarras,
      costo,
      precio,
      esServicio ? 0 : stock,
      publicado,
      destacado,
      esServicio,
      stockMinimo,
    )
    .run();

  const productoId = Number(insertado.meta.last_row_id);

  if (claveFoto) {
    await db
      .prepare("INSERT INTO foto (producto_id, clave_r2, clave_r2_web, orden) VALUES (?, ?, ?, 0)")
      .bind(productoId, claveFoto, claveFoto)
      .run();
  }

  if (stock > 0 && !esServicio) {
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
  const usuario = await editorDeCatalogo();
  if (!usuario) return { error: "Tu cuenta no tiene permiso para editar productos" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const id = Number(datos.get("id"));
  if (!id) return { error: "Producto no encontrado" };

  const actual = await db
    .prepare("SELECT slug, stock, costo FROM producto WHERE id = ?")
    .bind(id)
    .first<{ slug: string; stock: number; costo: number }>();
  if (!actual) return { error: "Producto no encontrado" };

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Escribe el nombre del producto" };

  const precio = leerMonto(datos.get("precio"));
  if (precio <= 0) return { error: "El precio debe ser mayor que cero" };

  const stock = Math.max(0, Math.round(leerMonto(datos.get("stock"))));

  let claveFoto: string | null = null;
  try {
    claveFoto = await guardarFoto(datos.get("foto") as File, actual.slug);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la foto" };
  }

  await db
    .prepare(
      `UPDATE producto SET
         categoria_id = ?, nombre_es = ?, nombre_en = ?, descripcion_es = ?, descripcion_en = ?,
         sku = ?, codigo_barras = ?, costo = ?, precio = ?, stock = ?, publicado = ?, destacado = ?,
         es_servicio = ?, stock_minimo = ?
       WHERE id = ?`,
    )
    .bind(
      Number(datos.get("categoria_id")) || null,
      nombre,
      String(datos.get("nombre_en") ?? "").trim() || null,
      String(datos.get("descripcion") ?? "").trim() || null,
      String(datos.get("descripcion_en") ?? "").trim() || null,
      String(datos.get("sku") ?? "").trim() || null,
      String(datos.get("codigo_barras") ?? "").trim() || null,
      // Quien no ve costos no los puede cambiar: el campo ni siquiera le sale.
      puede(usuario, "costos") ? leerMonto(datos.get("costo")) : actual.costo,
      precio,
      stock,
      datos.get("publicado") === "on" ? 1 : 0,
      datos.get("destacado") === "on" ? 1 : 0,
      datos.get("es_servicio") === "on" ? 1 : 0,
      Math.max(0, Math.round(leerMonto(datos.get("stock_minimo")))),
      id,
    )
    .run();

  // La foto nueva pasa adelante de las que ya había. Antes entraba con el
  // mismo orden que la vieja y la tienda seguía mostrando la anterior.
  if (claveFoto) {
    await db
      .prepare(
        `INSERT INTO foto (producto_id, clave_r2, clave_r2_web, orden)
         VALUES (?, ?, ?, (SELECT COALESCE(MIN(orden), 1) - 1 FROM foto WHERE producto_id = ?))`,
      )
      .bind(id, claveFoto, claveFoto, id)
      .run();
  }

  // El ajuste manual de stock queda anotado igual que una venta o una compra.
  const diferencia = stock - actual.stock;
  if (diferencia !== 0 && datos.get("es_servicio") !== "on") {
    await db
      .prepare(
        `INSERT INTO movimiento_inventario
           (producto_id, motivo, cantidad, stock_final, usuario_id, nota)
         VALUES (?, 'ajuste', ?, ?, ?, 'Ajuste desde el panel')`,
      )
      .bind(id, diferencia, stock, usuario.id)
      .run();
  }

  if (diferencia !== 0) {
    await anotarActividad({
      usuarioId: usuario.id,
      tipo: "ajuste",
      detalle: `Ajustó el stock de ${nombre}: ${diferencia > 0 ? "+" : ""}${diferencia} (quedó en ${stock})`,
      enlace: `/panel/inventario/${id}`,
    });
  }

  revalidatePath("/panel/inventario");
  revalidatePath(`/panel/inventario/${id}`);
  revalidatePath("/");
  return { guardado: true };
}

export async function alternarPublicado(datos: FormData): Promise<void> {
  const usuario = await editorDeCatalogo();
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
  const usuario = await editorDeCatalogo();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return;
  const nombreIngles = String(datos.get("nombre_en") ?? "").trim() || null;

  const orden = await db
    .prepare("SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM categoria")
    .first<{ siguiente: number }>();

  await db
    .prepare(
      `INSERT OR IGNORE INTO categoria (slug, nombre_es, nombre_en, emoji, orden, visible)
       VALUES (?, ?, ?, '📦', ?, 1)`,
    )
    .bind(aSlug(nombre), nombre, nombreIngles, orden?.siguiente ?? 1)
    .run();

  revalidatePath("/panel/inventario");
  revalidatePath("/panel/inventario/categorias");
  revalidatePath("/");
}

/**
 * Cambia el nombre de la categoría en los dos idiomas. El enlace de la
 * categoría no cambia, para no romper los que ya se compartieron.
 */
export async function editarCategoria(datos: FormData): Promise<void> {
  const usuario = await editorDeCatalogo();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const nombre = String(datos.get("nombre") ?? "").trim();
  if (!id || nombre.length < 2) return;

  await db
    .prepare("UPDATE categoria SET nombre_es = ?, nombre_en = ?, emoji = ? WHERE id = ?")
    .bind(
      nombre,
      String(datos.get("nombre_en") ?? "").trim() || null,
      String(datos.get("emoji") ?? "").trim().slice(0, 8) || "📦",
      id,
    )
    .run();

  revalidatePath("/panel/inventario/categorias");
  revalidatePath("/panel/inventario");
  revalidatePath("/");
}

/** Esconde o vuelve a mostrar la categoría en la tienda, sin borrar nada. */
export async function alternarCategoria(datos: FormData): Promise<void> {
  const usuario = await editorDeCatalogo();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  if (!id) return;

  await db.prepare("UPDATE categoria SET visible = 1 - visible WHERE id = ?").bind(id).run();

  revalidatePath("/panel/inventario/categorias");
  revalidatePath("/panel/inventario");
  revalidatePath("/");
}

/**
 * Elimina el producto. Solo el propietario.
 *
 * Las ventas, pedidos y cotizaciones donde aparece se conservan con el nombre
 * que tenía: el balance no cambia. Lo que se va es la ficha, sus fotos, sus
 * variantes y su historial de stock.
 */
export async function eliminarProducto(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "dueno") return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  if (!id) return;

  await borrarProductos(db, [id]);

  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect("/panel/inventario?eliminado=1");
}
