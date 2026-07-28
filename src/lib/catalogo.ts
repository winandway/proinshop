/**
 * Acceso al catálogo.
 *
 * Hoy lee del archivo de desarrollo. En la Etapa 3 estas mismas funciones
 * pasan a consultar D1 (`env.DB`) — las pantallas no cambian, porque todas
 * son asíncronas desde ahora.
 */

import { CATEGORIAS_DESARROLLO, PRODUCTOS_DESARROLLO } from "./catalogo-desarrollo";
import type { Categoria, Producto } from "./tipos";

export async function obtenerCategorias(): Promise<Categoria[]> {
  return CATEGORIAS_DESARROLLO.filter((c) => c.visible).sort((a, b) => a.orden - b.orden);
}

export async function obtenerCategoria(slug: string): Promise<Categoria | null> {
  return CATEGORIAS_DESARROLLO.find((c) => c.slug === slug && c.visible) ?? null;
}

export async function obtenerProductos(opciones?: {
  categoriaSlug?: string;
  destacados?: boolean;
  buscar?: string;
  orden?: "recientes" | "precio-asc" | "precio-desc";
}): Promise<Producto[]> {
  let lista = PRODUCTOS_DESARROLLO.filter((p) => p.publicado);

  if (opciones?.categoriaSlug) {
    lista = lista.filter((p) => p.categoriaSlug === opciones.categoriaSlug);
  }
  if (opciones?.destacados) {
    lista = lista.filter((p) => p.destacado);
  }
  if (opciones?.buscar) {
    const q = normalizar(opciones.buscar);
    lista = lista.filter(
      (p) =>
        normalizar(p.nombre.es).includes(q) ||
        normalizar(p.nombre.en).includes(q) ||
        normalizar(p.sku).includes(q),
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

export async function obtenerProducto(slug: string): Promise<Producto | null> {
  return PRODUCTOS_DESARROLLO.find((p) => p.slug === slug && p.publicado) ?? null;
}

export async function obtenerProductosPorSlugs(slugs: string[]): Promise<Producto[]> {
  return PRODUCTOS_DESARROLLO.filter((p) => p.publicado && slugs.includes(p.slug));
}

export async function contarProductosPorCategoria(): Promise<Record<string, number>> {
  const conteo: Record<string, number> = {};
  for (const p of PRODUCTOS_DESARROLLO) {
    if (!p.publicado) continue;
    conteo[p.categoriaSlug] = (conteo[p.categoriaSlug] ?? 0) + 1;
  }
  return conteo;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
