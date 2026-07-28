"use client";

import { useSyncExternalStore } from "react";
import * as almacen from "@/lib/almacen-carrito";

/** Estado del carrito, leído del almacén que vive fuera de React. */
export function useCarrito() {
  const estado = useSyncExternalStore(
    almacen.suscribir,
    almacen.instantanea,
    almacen.instantaneaServidor,
  );

  return {
    lineas: estado.lineas,
    listo: estado.listo,
    unidades: estado.lineas.reduce((suma, l) => suma + l.cantidad, 0),
    agregar: almacen.agregar,
    cambiarCantidad: almacen.cambiarCantidad,
    quitar: almacen.quitar,
    vaciar: almacen.vaciar,
  };
}

/**
 * El carrito ya no necesita un proveedor: el almacén es único y compartido.
 * Se conserva el componente para no dispersar el árbol del layout.
 */
export function ProveedorCarrito({ children }: { children: React.ReactNode }) {
  return children;
}
