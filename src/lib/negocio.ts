/** Consultas compartidas por los módulos del panel. */

import { baseDeDatos } from "./d1";

export type VarianteVenta = { id: number; nombre: string; stock: number; precioExtra: number };

export type ProductoVenta = {
  id: number;
  nombre_es: string;
  precio: number;
  costo: number;
  stock: number;
  emoji: string | null;
  foto: string | null;
  codigo_barras: string | null;
  sku: string | null;
  es_servicio: number;
  variantes: VarianteVenta[];
};

/**
 * Todo el catálogo para la pantalla de Vender, con sus variantes. Antes
 * llegaban solo 60 productos y el buscador no encontraba el resto; un negocio
 * de este tamaño cabe entero sin problema.
 */
export async function productosParaVender(): Promise<ProductoVenta[]> {
  const db = await baseDeDatos();
  if (!db) return [];

  const [{ results: productos }, { results: variantes }] = await Promise.all([
    db
      .prepare(
        `SELECT p.id, p.nombre_es, p.precio, p.costo, p.stock, p.emoji, p.codigo_barras, p.sku,
                COALESCE(p.es_servicio, 0) AS es_servicio,
                (SELECT clave_r2_web FROM foto WHERE producto_id = p.id ORDER BY orden, id DESC LIMIT 1) AS foto
         FROM producto p
         ORDER BY (p.stock > 0 OR COALESCE(p.es_servicio, 0) = 1) DESC, p.id DESC
         LIMIT 3000`,
      )
      .all<Omit<ProductoVenta, "variantes">>(),
    db
      .prepare("SELECT id, producto_id, nombre_es, stock, precio_extra FROM variante ORDER BY id")
      .all<{ id: number; producto_id: number; nombre_es: string; stock: number; precio_extra: number }>(),
  ]);

  const porProducto = new Map<number, VarianteVenta[]>();
  for (const variante of variantes) {
    const lista = porProducto.get(variante.producto_id) ?? [];
    lista.push({
      id: variante.id,
      nombre: variante.nombre_es,
      stock: variante.stock,
      precioExtra: variante.precio_extra,
    });
    porProducto.set(variante.producto_id, lista);
  }

  return productos.map((producto) => ({ ...producto, variantes: porProducto.get(producto.id) ?? [] }));
}

export type ClienteSimple = { id: number; nombre: string; telefono: string | null };

export async function listaClientes(): Promise<ClienteSimple[]> {
  const db = await baseDeDatos();
  if (!db) return [];
  const { results } = await db
    .prepare("SELECT id, nombre, telefono FROM cliente ORDER BY nombre LIMIT 200")
    .all<ClienteSimple>();
  return results;
}

export async function listaProveedores(): Promise<ClienteSimple[]> {
  const db = await baseDeDatos();
  if (!db) return [];
  const { results } = await db
    .prepare("SELECT id, nombre, telefono FROM proveedor ORDER BY nombre LIMIT 200")
    .all<ClienteSimple>();
  return results;
}

/** Datos del negocio, con valores por defecto si la fila no existe. */
export async function datosNegocio() {
  const db = await baseDeDatos();
  const fila = db
    ? await db
        .prepare("SELECT * FROM negocio WHERE id = 1")
        .first<{
          nombre: string;
          dominio: string;
          whatsapp: string | null;
          correo: string | null;
          direccion: string | null;
          costo_envio: number;
          mostrar_stock: number;
          ocultar_agotados: number;
          umbral_stock: number | null;
          moneda2: string | null;
          tasa2: number | null;
        }>()
    : null;

  return {
    nombre: fila?.nombre ?? "Proinshop",
    dominio: fila?.dominio ?? "proinshop.com",
    whatsapp: fila?.whatsapp ?? "",
    correo: fila?.correo ?? "",
    direccion: fila?.direccion ?? "",
    costoEnvio: fila?.costo_envio ?? 25,
    mostrarStock: (fila?.mostrar_stock ?? 1) === 1,
    ocultarAgotados: (fila?.ocultar_agotados ?? 0) === 1,
    umbralStock: fila?.umbral_stock ?? 3,
    moneda2: (fila?.moneda2 ?? "").trim().toUpperCase(),
    tasa2: fila?.tasa2 ?? 0,
  };
}

// Las listas fijas viven aparte para poder usarlas en el navegador sin
// arrastrar el acceso a la base.
export { CATEGORIAS_GASTO, METODOS_PAGO, NOMBRE_METODO, type MetodoPago } from "./metodos";
