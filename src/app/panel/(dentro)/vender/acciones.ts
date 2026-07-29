"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { usuarioActual } from "@/lib/sesion";

export type ResultadoVenta = { error?: string };

type LineaVenta = { productoId: number; cantidad: number; precio: number };

/**
 * Registra la venta y mueve todo lo que depende de ella: descuenta stock,
 * anota el movimiento de inventario y, si fue fiado, crea la deuda.
 *
 * D1 no expone transacciones por HTTP, así que el orden importa: primero la
 * venta (que es lo que no se puede perder) y después el resto.
 */
export async function registrarVenta(
  _previo: ResultadoVenta,
  datos: FormData,
): Promise<ResultadoVenta> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  let lineas: LineaVenta[];
  try {
    lineas = JSON.parse(String(datos.get("lineas") ?? "[]"));
  } catch {
    return { error: "No se pudo leer la venta" };
  }
  if (!Array.isArray(lineas) || lineas.length === 0) {
    return { error: "Agrega al menos un producto" };
  }

  const metodoPago = String(datos.get("metodo_pago") ?? "efectivo");
  const clienteId = Number(datos.get("cliente_id")) || null;
  const descuento = Math.max(0, Number(datos.get("descuento")) || 0);

  if (metodoPago === "fiado" && !clienteId) {
    return { error: "Para vender fiado tienes que elegir el cliente" };
  }

  // Se leen los productos de la base: el precio y el costo no se toman del
  // navegador, que se puede manipular.
  const ids = lineas.map((l) => l.productoId);
  const marcas = ids.map(() => "?").join(",");
  const { results: productos } = await db
    .prepare(`SELECT id, nombre_es, precio, costo, stock FROM producto WHERE id IN (${marcas})`)
    .bind(...ids)
    .all<{ id: number; nombre_es: string; precio: number; costo: number; stock: number }>();

  let subtotal = 0;
  const detalle: {
    producto: (typeof productos)[number];
    cantidad: number;
  }[] = [];

  for (const linea of lineas) {
    const producto = productos.find((p) => p.id === linea.productoId);
    if (!producto) return { error: "Uno de los productos ya no existe" };

    const cantidad = Math.max(1, Math.round(linea.cantidad));
    if (cantidad > producto.stock) {
      return { error: `Solo quedan ${producto.stock} de "${producto.nombre_es}"` };
    }

    subtotal += producto.precio * cantidad;
    detalle.push({ producto, cantidad });
  }

  const total = Math.max(0, subtotal - descuento);
  const pagada = metodoPago === "fiado" ? 0 : 1;

  const venta = await db
    .prepare(
      `INSERT INTO venta (canal, cliente_id, usuario_id, metodo_pago, subtotal, descuento, total, pagada)
       VALUES ('local', ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(clienteId, usuario.id, metodoPago, subtotal, descuento, total, pagada)
    .run();

  const ventaId = Number(venta.meta.last_row_id);

  for (const { producto, cantidad } of detalle) {
    await db
      .prepare(
        `INSERT INTO venta_item (venta_id, producto_id, descripcion, cantidad, precio_unit, costo_unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(ventaId, producto.id, producto.nombre_es, cantidad, producto.precio, producto.costo)
      .run();

    const stockFinal = producto.stock - cantidad;
    await db
      .prepare("UPDATE producto SET stock = ? WHERE id = ?")
      .bind(stockFinal, producto.id)
      .run();

    await db
      .prepare(
        `INSERT INTO movimiento_inventario
           (producto_id, motivo, cantidad, stock_final, usuario_id, referencia)
         VALUES (?, 'venta', ?, ?, ?, ?)`,
      )
      .bind(producto.id, -cantidad, stockFinal, usuario.id, `Venta #${ventaId}`)
      .run();
  }

  if (metodoPago === "fiado" && clienteId) {
    await db
      .prepare(
        `INSERT INTO deuda (cliente_id, venta_id, monto, saldo, vence)
         VALUES (?, ?, ?, ?, date('now', '+30 days'))`,
      )
      .bind(clienteId, ventaId, total, total)
      .run();
  }

  revalidatePath("/panel");
  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect(`/panel/vender/${ventaId}`);
}

export async function crearCliente(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return;

  await db
    .prepare("INSERT INTO cliente (nombre, telefono, correo, direccion) VALUES (?, ?, ?, ?)")
    .bind(
      nombre,
      String(datos.get("telefono") ?? "").trim() || null,
      String(datos.get("correo") ?? "").trim() || null,
      String(datos.get("direccion") ?? "").trim() || null,
    )
    .run();

  revalidatePath("/panel/clientes");
  revalidatePath("/panel/vender");
}
