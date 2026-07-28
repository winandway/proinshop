/**
 * Convierte el catálogo de desarrollo en sentencias SQL parametrizadas para
 * cargarlo en la base D1 del sitio.
 *
 *   node herramientas/generar-seed.mjs > /tmp/seed.json
 *   DB_TOKEN=… node herramientas/db-remota.mjs /tmp/seed.json
 *
 * Se ejecuta una sola vez, para arrancar la tienda con catálogo. A partir de
 * ahí los productos los carga el dueño desde la app de administración.
 */

import { readFileSync } from "node:fs";

// El catálogo está en TypeScript; se lee como texto y se evalúa la parte de
// datos. Más simple que montar un compilador solo para esto.
const fuente = readFileSync("src/lib/catalogo-desarrollo.ts", "utf8");

const soloDatos = fuente
  .replace(/^import[^\n]*\n/gm, "")
  .replace(/:\s*(Categoria|Producto)\[\]/g, "")
  .replace(/export const/g, "const");

const { CATEGORIAS_DESARROLLO, PRODUCTOS_DESARROLLO } = await import(
  "data:text/javascript," +
    encodeURIComponent(
      soloDatos + "\nexport { CATEGORIAS_DESARROLLO, PRODUCTOS_DESARROLLO };",
    )
);

const sentencias = [];

// Datos del negocio.
sentencias.push({
  sql: `INSERT OR REPLACE INTO negocio
        (id, nombre, dominio, moneda, costo_envio, mostrar_stock, ocultar_agotados)
        VALUES (1, ?, ?, 'USD', ?, 1, 0)`,
  params: ["Proinshop", "proinshop.com", 25],
});

for (const c of CATEGORIAS_DESARROLLO) {
  sentencias.push({
    sql: `INSERT OR REPLACE INTO categoria
          (id, slug, nombre_es, nombre_en, emoji, orden, visible)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params: [c.id, c.slug, c.nombre.es, c.nombre.en, c.emoji, c.orden, c.visible ? 1 : 0],
  });
}

const idCategoria = new Map(CATEGORIAS_DESARROLLO.map((c) => [c.slug, c.id]));

for (const p of PRODUCTOS_DESARROLLO) {
  sentencias.push({
    sql: `INSERT OR REPLACE INTO producto
          (id, categoria_id, slug, nombre_es, nombre_en, descripcion_es, descripcion_en,
           sku, costo, precio, precio_anterior, stock, publicado, destacado,
           etiqueta_es, etiqueta_en, emoji, creado_por_ia)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    params: [
      p.id,
      idCategoria.get(p.categoriaSlug) ?? null,
      p.slug,
      p.nombre.es,
      p.nombre.en,
      p.descripcion.es,
      p.descripcion.en,
      p.sku,
      p.costo,
      p.precio,
      p.precioAnterior ?? null,
      p.stock,
      p.publicado ? 1 : 0,
      p.destacado ? 1 : 0,
      p.etiqueta?.es ?? null,
      p.etiqueta?.en ?? null,
      p.emoji,
    ],
  });

  for (const v of p.variantes) {
    sentencias.push({
      sql: `INSERT OR REPLACE INTO variante
            (id, producto_id, nombre_es, nombre_en, stock, precio_extra)
            VALUES (?, ?, ?, ?, ?, ?)`,
      params: [v.id, p.id, v.nombre.es, v.nombre.en, v.stock, v.precioExtra],
    });
  }

  for (const [orden, e] of p.especificaciones.entries()) {
    sentencias.push({
      sql: `INSERT INTO especificacion
            (producto_id, etiqueta_es, etiqueta_en, valor_es, valor_en, orden)
            VALUES (?, ?, ?, ?, ?, ?)`,
      params: [p.id, e.etiqueta.es, e.etiqueta.en, e.valor.es, e.valor.en, orden],
    });
  }
}

process.stdout.write(JSON.stringify(sentencias, null, 2));
