"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { baseDeDatos } from "@/lib/d1";
import { anotarActividad } from "@/lib/actividad";
import { leerCsv, normalizarEncabezado } from "@/lib/csv";
import { leerMonto } from "@/lib/numeros";
import { puede, usuarioQuePuede } from "@/lib/sesion";

export type ResultadoImportar = { error?: string };

/** Cómo puede venir escrito cada encabezado. */
const SINONIMOS: Record<string, string[]> = {
  id: ["id"],
  nombre: ["nombre", "producto", "nombre_del_producto", "name"],
  nombre_en: ["nombre_en", "nombre_en_ingles", "name_en", "english_name"],
  categoria: ["categoria", "category"],
  precio: ["precio", "precio_de_venta", "price"],
  costo: ["costo", "cost", "precio_de_costo"],
  stock: ["stock", "cantidad", "existencias", "unidades", "quantity"],
  stock_minimo: ["stock_minimo", "minimo", "alerta"],
  codigo_barras: ["codigo_barras", "codigo_de_barras", "codigo", "barcode", "ean"],
  sku: ["sku", "referencia"],
  publicado: ["publicado", "en_tienda", "visible"],
  servicio: ["servicio", "es_servicio"],
  descripcion: ["descripcion", "description"],
  descripcion_en: ["descripcion_en", "descripcion_en_ingles", "description_en"],
};

const si = (valor: string | undefined) => /^(si|sí|s|yes|y|1|x|true|verdadero)$/i.test((valor ?? "").trim());

function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Carga productos desde un Excel guardado como CSV. Si el renglón trae el id
 * (o un código de barras o SKU que ya existe), actualiza ese producto; si no,
 * lo crea. Las categorías que no existan se crean solas.
 */
export async function importarProductos(
  _previo: ResultadoImportar,
  datos: FormData,
): Promise<ResultadoImportar> {
  const usuario = await usuarioQuePuede("inventario");
  if (!usuario) return { error: "Tu cuenta no tiene permiso para cargar productos" };
  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elige el archivo" };
  if (archivo.size > 5 * 1024 * 1024) return { error: "El archivo pesa más de 5 MB" };
  if (/\.xlsx?$/i.test(archivo.name)) {
    return {
      error:
        "Ese archivo es de Excel normal. Ábrelo en Excel y usa Guardar como → CSV UTF-8, y sube ese.",
    };
  }

  const filas = leerCsv(await archivo.text());
  if (filas.length < 2) return { error: "El archivo no trae productos" };
  if (filas.length > 3001) return { error: "Máximo 3.000 productos por archivo" };

  const encabezados = (filas[0] ?? []).map(normalizarEncabezado);
  const columna: Record<string, number> = {};
  for (const [campo, nombres] of Object.entries(SINONIMOS)) {
    const indice = encabezados.findIndex((e) => nombres.includes(e));
    if (indice >= 0) columna[campo] = indice;
  }
  if (columna.nombre === undefined || columna.precio === undefined) {
    return { error: "El archivo tiene que traer al menos las columnas «nombre» y «precio»" };
  }

  const conCosto = puede(usuario, "costos");
  const valor = (fila: string[], campo: string) =>
    columna[campo] === undefined ? undefined : (fila[columna[campo]!] ?? "").trim();

  const [{ results: existentes }, { results: categorias }] = await Promise.all([
    db
      .prepare("SELECT id, slug, codigo_barras, sku FROM producto")
      .all<{ id: number; slug: string; codigo_barras: string | null; sku: string | null }>(),
    db.prepare("SELECT id, nombre_es, slug FROM categoria").all<{ id: number; nombre_es: string; slug: string }>(),
  ]);
  const slugs = new Set(existentes.map((p) => p.slug));

  const errores: string[] = [];
  let creados = 0;
  let actualizados = 0;

  async function categoriaDe(nombre: string | undefined): Promise<number | null> {
    if (!nombre) return null;
    const buscada = nombre.trim().toLowerCase();
    const encontrada = categorias.find((c) => c.nombre_es.trim().toLowerCase() === buscada);
    if (encontrada) return encontrada.id;
    const slug = aSlug(nombre) || `categoria-${categorias.length + 1}`;
    const creada = await db!
      .prepare(
        `INSERT INTO categoria (slug, nombre_es, emoji, orden, visible)
         VALUES (?, ?, '📦', (SELECT COALESCE(MAX(orden), 0) + 1 FROM categoria), 1)
         ON CONFLICT(slug) DO UPDATE SET nombre_es = categoria.nombre_es RETURNING id`,
      )
      .bind(slug, nombre.trim())
      .first<{ id: number }>();
    if (!creada) return null;
    categorias.push({ id: creada.id, nombre_es: nombre.trim(), slug });
    return creada.id;
  }

  for (let i = 1; i < filas.length; i += 1) {
    const fila = filas[i]!;
    const renglon = i + 1;
    const nombre = valor(fila, "nombre");
    if (!nombre || nombre.length < 2) {
      errores.push(`renglón ${renglon}: falta el nombre`);
      continue;
    }
    const precio = leerMonto(valor(fila, "precio"));
    if (!(precio > 0)) {
      errores.push(`renglón ${renglon}: el precio de «${nombre}» no es válido`);
      continue;
    }

    const codigo = valor(fila, "codigo_barras") || null;
    const sku = valor(fila, "sku") || null;
    const id = Number(valor(fila, "id")) || null;
    const existente =
      (id && existentes.find((p) => p.id === id)) ||
      (codigo && existentes.find((p) => p.codigo_barras === codigo)) ||
      (sku && existentes.find((p) => p.sku === sku)) ||
      null;

    const categoriaId = await categoriaDe(valor(fila, "categoria"));
    const stockTexto = valor(fila, "stock");
    const stock = stockTexto ? Math.max(0, Math.round(leerMonto(stockTexto))) : null;
    const servicio = valor(fila, "servicio") !== undefined ? si(valor(fila, "servicio")) : false;
    const publicado = valor(fila, "publicado") !== undefined ? si(valor(fila, "publicado")) : true;
    const costo = conCosto && valor(fila, "costo") ? leerMonto(valor(fila, "costo")) : null;

    if (existente) {
      await db
        .prepare(
          `UPDATE producto SET nombre_es = ?, nombre_en = COALESCE(?, nombre_en),
             categoria_id = COALESCE(?, categoria_id), precio = ?, costo = COALESCE(?, costo),
             stock = COALESCE(?, stock), stock_minimo = COALESCE(?, stock_minimo),
             codigo_barras = COALESCE(?, codigo_barras), sku = COALESCE(?, sku), publicado = ?,
             es_servicio = ?, descripcion_es = COALESCE(?, descripcion_es),
             descripcion_en = COALESCE(?, descripcion_en)
           WHERE id = ?`,
        )
        .bind(
          nombre,
          valor(fila, "nombre_en") || null,
          categoriaId,
          precio,
          costo,
          servicio ? 0 : stock,
          valor(fila, "stock_minimo") ? Math.round(leerMonto(valor(fila, "stock_minimo"))) : null,
          codigo,
          sku,
          publicado ? 1 : 0,
          servicio ? 1 : 0,
          valor(fila, "descripcion") || null,
          valor(fila, "descripcion_en") || null,
          existente.id,
        )
        .run();
      actualizados += 1;
    } else {
      let slug = aSlug(nombre) || "producto";
      for (let n = 2; slugs.has(slug); n += 1) slug = `${aSlug(nombre) || "producto"}-${n}`;
      slugs.add(slug);
      const creado = await db
        .prepare(
          `INSERT INTO producto (categoria_id, slug, nombre_es, nombre_en, descripcion_es, descripcion_en, sku,
             codigo_barras, costo, precio, stock, stock_minimo, publicado, destacado, emoji, es_servicio)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '📦', ?)`,
        )
        .bind(
          categoriaId,
          slug,
          nombre,
          valor(fila, "nombre_en") || null,
          valor(fila, "descripcion") || null,
          valor(fila, "descripcion_en") || null,
          sku,
          codigo,
          costo ?? 0,
          precio,
          servicio ? 0 : (stock ?? 0),
          valor(fila, "stock_minimo") ? Math.round(leerMonto(valor(fila, "stock_minimo"))) : 0,
          publicado ? 1 : 0,
          servicio ? 1 : 0,
        )
        .run();
      const nuevoId = Number(creado.meta.last_row_id);
      existentes.push({ id: nuevoId, slug, codigo_barras: codigo, sku });
      if (!servicio && stock && stock > 0) {
        await db
          .prepare(
            `INSERT INTO movimiento_inventario (producto_id, motivo, cantidad, stock_final, usuario_id, nota)
             VALUES (?, 'alta', ?, ?, ?, 'Carga desde Excel')`,
          )
          .bind(nuevoId, stock, stock, usuario.id)
          .run();
      }
      creados += 1;
    }
  }

  if (creados + actualizados === 0) {
    return { error: `No se cargó nada. ${errores.slice(0, 5).join("; ")}` };
  }

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "importacion",
    detalle: `Cargó un Excel: ${creados} productos nuevos, ${actualizados} actualizados${errores.length ? `, ${errores.length} renglones con error` : ""}`,
    enlace: "/panel/inventario",
  });

  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect(`/panel/inventario?importados=${creados + actualizados}`);
}
