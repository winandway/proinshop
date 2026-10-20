/**
 * Cuentas del inventario, sin base ni pantalla: así se pueden probar solas.
 */

/**
 * Costo promedio ponderado: si tenía 10 unidades a $100 y compra 10 a $120,
 * el costo pasa a $110. Es lo que hace que la ganancia real sea confiable
 * cuando el proveedor cambia el precio.
 */
export function costoPromedio(
  stockActual: number,
  costoActual: number,
  cantidadComprada: number,
  costoCompra: number,
): number {
  const antes = Math.max(0, stockActual);
  const total = antes + cantidadComprada;
  if (cantidadComprada <= 0) return costoActual;
  if (total <= 0 || antes === 0) return Math.round(costoCompra * 100) / 100;
  const promedio = (antes * costoActual + cantidadComprada * costoCompra) / total;
  return Math.round(promedio * 100) / 100;
}

/** ¿Hay que avisar que se está acabando? Usa el mínimo del producto o el general. */
export function estaPorAgotarse(
  stock: number,
  minimoProducto: number,
  umbralGeneral: number,
  esServicio = false,
): boolean {
  if (esServicio) return false;
  const minimo = minimoProducto > 0 ? minimoProducto : umbralGeneral;
  return stock <= minimo;
}
