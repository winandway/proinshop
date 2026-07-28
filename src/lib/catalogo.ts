/**
 * Acceso al catálogo.
 *
 * Lee de la base D1 del sitio (`env.DB`). Si no hay base disponible —por
 * ejemplo `npm run dev` sin el entorno de Cloudflare— cae al catálogo de
 * desarrollo, para poder trabajar sin conexión.
 */

import { CATEGORIAS_DESARROLLO, PRODUCTOS_DESARROLLO } from "./catalogo-desarrollo";
import { baseDeDatos } from "./d1";
import type { Categoria, Especificacion, Producto, Variante } from "./tipos";

/** Fila tal como la devuelve D1 para un producto con su categoría. */
type FilaProducto = {
  id: number;
  slug: string;
  categoria_slug: string | null;
  nombre_es: string;
  nombre_en: string | null;
  descripcion_es: string | null;
  descripcion_en: string | null;
  sku: string | null;
  costo: number;
  precio: number;
  precio_anterior: number | null;
  stock: number;
  publicado: number;
  destacado: number;
  etiqueta_es: string | null;
  etiqueta_en: string | null;
  emoji: string | null;
};

function texto(es: string | null, en: string | null) {
  return { es: es ?? "", en: en ?? es ?? "" };
}

async function armarProductos(filas: FilaProducto[]): Promise<Producto[]> {
  const db = await baseDeDatos();
  if (!db || filas.length === 0) return [];

  const ids = filas.map((f) => f.id);
  const marcas = ids.map(() => "?").join(",");

  const [variantes, especificaciones, fotos] = await Promise.all([
    db
      .prepare(`SELECT * FROM variante WHERE producto_id IN (${marcas}) ORDER BY id`)
      .bind(...ids)
      .all(),
    db
      .prepare(
        `SELECT * FROM especificacion WHERE producto_id IN (${marcas}) ORDER BY producto_id, orden`,
      )
      .bind(...ids)
      .all(),
    db
      .prepare(
        `SELECT producto_id, clave_r2_web, clave_r2 FROM foto
         WHERE producto_id IN (${marcas}) ORDER BY producto_id, orden`,
      )
      .bind(...ids)
      .all(),
  ]);

  const porProducto = <T extends { producto_id: number }>(resultados: unknown) =>
    ((resultados as { results?: T[] })?.results ?? []).reduce<Map<number, T[]>>((mapa, fila) => {
      const lista = mapa.get(fila.producto_id) ?? [];
      lista.push(fila);
      mapa.set(fila.producto_id, lista);
      return mapa;
    }, new Map());

  const mapaVariantes = porProducto<{
    producto_id: number;
    id: number;
    nombre_es: string;
    nombre_en: string | null;
    stock: number;
    precio_extra: number;
  }>(variantes);

  const mapaEspecificaciones = porProducto<{
    producto_id: number;
    etiqueta_es: string;
    etiqueta_en: string | null;
    valor_es: string;
    valor_en: string | null;
  }>(especificaciones);

  const mapaFotos = porProducto<{
    producto_id: number;
    clave_r2_web: string | null;
    clave_r2: string;
  }>(fotos);

  return filas.map((f) => ({
    id: f.id,
    slug: f.slug,
    categoriaSlug: f.categoria_slug ?? "",
    nombre: texto(f.nombre_es, f.nombre_en),
    descripcion: texto(f.descripcion_es, f.descripcion_en),
    precio: f.precio,
    precioAnterior: f.precio_anterior ?? undefined,
    costo: f.costo,
    stock: f.stock,
    sku: f.sku ?? "",
    publicado: f.publicado === 1,
    destacado: f.destacado === 1,
    etiqueta: f.etiqueta_es ? texto(f.etiqueta_es, f.etiqueta_en) : undefined,
    emoji: f.emoji ?? "📦",
    fotos: (mapaFotos.get(f.id) ?? []).map((foto) => foto.clave_r2_web ?? foto.clave_r2),
    variantes: (mapaVariantes.get(f.id) ?? []).map<Variante>((v) => ({
      id: v.id,
      nombre: texto(v.nombre_es, v.nombre_en),
      stock: v.stock,
      precioExtra: v.precio_extra,
    })),
    especificaciones: (mapaEspecificaciones.get(f.id) ?? []).map<Especificacion>((e) => ({
      etiqueta: texto(e.etiqueta_es, e.etiqueta_en),
      valor: texto(e.valor_es, e.valor_en),
    })),
  }));
}

const SELECCION = `SELECT p.*, c.slug AS categoria_slug
                   FROM producto p
                   LEFT JOIN categoria c ON c.id = p.categoria_id
                   WHERE p.publicado = 1`;

export async function obtenerCategorias(): Promise<Categoria[]> {
  const db = await baseDeDatos();
  if (!db) return CATEGORIAS_DESARROLLO.filter((c) => c.visible).sort((a, b) => a.orden - b.orden);

  const { results } = await db
    .prepare("SELECT * FROM categoria WHERE visible = 1 ORDER BY orden")
    .all<{
      id: number;
      slug: string;
      nombre_es: string;
      nombre_en: string | null;
      emoji: string | null;
      orden: number;
    }>();

  return results.map((c) => ({
    id: c.id,
    slug: c.slug,
    nombre: texto(c.nombre_es, c.nombre_en),
    emoji: c.emoji ?? "📦",
    orden: c.orden,
    visible: true,
  }));
}

export async function obtenerCategoria(slug: string): Promise<Categoria | null> {
  const categorias = await obtenerCategorias();
  return categorias.find((c) => c.slug === slug) ?? null;
}

export async function obtenerProductos(opciones?: {
  categoriaSlug?: string;
  destacados?: boolean;
  buscar?: string;
  orden?: "recientes" | "precio-asc" | "precio-desc";
}): Promise<Producto[]> {
  const db = await baseDeDatos();
  if (!db) return productosDeDesarrollo(opciones);

  const condiciones: string[] = [];
  const valores: (string | number)[] = [];

  if (opciones?.categoriaSlug) {
    condiciones.push("c.slug = ?");
    valores.push(opciones.categoriaSlug);
  }
  if (opciones?.destacados) {
    condiciones.push("p.destacado = 1");
  }
  if (opciones?.buscar) {
    condiciones.push("(lower(p.nombre_es) LIKE ? OR lower(p.nombre_en) LIKE ? OR lower(p.sku) LIKE ?)");
    const patron = `%${opciones.buscar.toLowerCase()}%`;
    valores.push(patron, patron, patron);
  }

  const orden =
    opciones?.orden === "precio-asc"
      ? "p.precio ASC"
      : opciones?.orden === "precio-desc"
        ? "p.precio DESC"
        : "p.id DESC";

  const sql = `${SELECCION}${condiciones.length ? " AND " + condiciones.join(" AND ") : ""} ORDER BY ${orden}`;
  const { results } = await db
    .prepare(sql)
    .bind(...valores)
    .all<FilaProducto>();

  return armarProductos(results);
}

export async function obtenerProducto(slug: string): Promise<Producto | null> {
  const db = await baseDeDatos();
  if (!db) return PRODUCTOS_DESARROLLO.find((p) => p.slug === slug && p.publicado) ?? null;

  const { results } = await db
    .prepare(`${SELECCION} AND p.slug = ?`)
    .bind(slug)
    .all<FilaProducto>();

  const productos = await armarProductos(results);
  return productos[0] ?? null;
}

export async function contarProductosPorCategoria(): Promise<Record<string, number>> {
  const db = await baseDeDatos();
  if (!db) {
    const conteo: Record<string, number> = {};
    for (const p of PRODUCTOS_DESARROLLO) {
      if (p.publicado) conteo[p.categoriaSlug] = (conteo[p.categoriaSlug] ?? 0) + 1;
    }
    return conteo;
  }

  const { results } = await db
    .prepare(
      `SELECT c.slug, COUNT(p.id) AS total
       FROM categoria c LEFT JOIN producto p ON p.categoria_id = c.id AND p.publicado = 1
       GROUP BY c.id`,
    )
    .all<{ slug: string; total: number }>();

  return Object.fromEntries(results.map((f) => [f.slug, f.total]));
}

/** Respaldo para trabajar en local sin el entorno de Cloudflare. */
function productosDeDesarrollo(opciones?: {
  categoriaSlug?: string;
  destacados?: boolean;
  buscar?: string;
  orden?: "recientes" | "precio-asc" | "precio-desc";
}): Producto[] {
  let lista = PRODUCTOS_DESARROLLO.filter((p) => p.publicado);

  if (opciones?.categoriaSlug) lista = lista.filter((p) => p.categoriaSlug === opciones.categoriaSlug);
  if (opciones?.destacados) lista = lista.filter((p) => p.destacado);
  if (opciones?.buscar) {
    const q = opciones.buscar
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    lista = lista.filter(
      (p) =>
        p.nombre.es.toLowerCase().includes(q) ||
        p.nombre.en.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }

  switch (opciones?.orden) {
    case "precio-asc":
      return [...lista].sort((a, b) => a.precio - b.precio);
    case "precio-desc":
      return [...lista].sort((a, b) => b.precio - a.precio);
    default:
      return [...lista].sort((a, b) => b.id - a.id);
  }
}
