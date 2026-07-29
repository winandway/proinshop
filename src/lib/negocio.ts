/** Consultas compartidas por los módulos del panel. */

import { baseDeDatos } from "./d1";

export type ProductoVenta = {
  id: number;
  nombre_es: string;
  precio: number;
  costo: number;
  stock: number;
  emoji: string | null;
  foto: string | null;
};

export async function productosParaVender(buscar?: string): Promise<ProductoVenta[]> {
  const db = await baseDeDatos();
  if (!db) return [];

  const filtro = buscar?.trim();
  const consulta = `SELECT p.id, p.nombre_es, p.precio, p.costo, p.stock, p.emoji,
                      (SELECT clave_r2_web FROM foto WHERE producto_id = p.id ORDER BY orden LIMIT 1) AS foto
                    FROM producto p
                    ${filtro ? "WHERE lower(p.nombre_es) LIKE ? OR p.sku = ? OR p.codigo_barras = ?" : ""}
                    ORDER BY p.stock > 0 DESC, p.id DESC
                    LIMIT 60`;

  const preparada = db.prepare(consulta);
  const { results } = filtro
    ? await preparada.bind(`%${filtro.toLowerCase()}%`, filtro, filtro).all<ProductoVenta>()
    : await preparada.all<ProductoVenta>();

  return results;
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
  };
}

export const METODOS_PAGO = [
  { valor: "efectivo", texto: "💵 Efectivo" },
  { valor: "transferencia", texto: "🏦 Transferencia" },
  { valor: "tarjeta", texto: "💳 Tarjeta" },
  { valor: "fiado", texto: "🕐 Fiado" },
] as const;

export const CATEGORIAS_GASTO = [
  "Importación",
  "Mercancía",
  "Arriendo",
  "Servicios",
  "Nómina",
  "Transporte",
  "Otra",
] as const;
