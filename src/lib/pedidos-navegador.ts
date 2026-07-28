/**
 * Pedidos guardados en el navegador.
 *
 * Es una solución de la Etapa 2, mientras no exista la base de datos: el
 * pedido se guarda localmente para poder mostrar la pantalla de confirmación
 * y el seguimiento. En la Etapa 3 el checkout escribe en D1 con una acción de
 * servidor y este archivo desaparece.
 */

import type { MetodoEntrega, MetodoPago } from "./tipos";

export type PedidoGuardado = {
  numero: string;
  fecha: string;
  cliente: { nombre: string; celular: string; correo: string; direccion: string };
  entrega: MetodoEntrega;
  pago: MetodoPago;
  lineas: {
    nombre: string;
    variante: string | null;
    emoji: string;
    cantidad: number;
    precioUnitario: number;
  }[];
  subtotal: number;
  envio: number;
  total: number;
};

const PREFIJO = "proinshop_pedido_";

/** Número visible del pedido. En la Etapa 3 lo asigna la base de datos. */
export function nuevoNumeroDePedido(): string {
  return String(1000 + Math.floor(Date.now() % 9000));
}

export function fechaDeAhora(): string {
  return new Date().toISOString();
}

export function guardarPedido(pedido: PedidoGuardado): void {
  try {
    window.localStorage.setItem(PREFIJO + pedido.numero, JSON.stringify(pedido));
  } catch {
    // Sin almacenamiento no se puede mostrar el seguimiento; el pedido igual se envía.
  }
}

export function leerPedido(numero: string): PedidoGuardado | null {
  try {
    const guardado = window.localStorage.getItem(PREFIJO + numero);
    return guardado ? (JSON.parse(guardado) as PedidoGuardado) : null;
  } catch {
    return null;
  }
}
