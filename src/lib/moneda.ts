import { formatearPrecio } from "./i18n";

/**
 * Segunda moneda: los precios y las cuentas viven en dólares, y el panel
 * muestra al lado el equivalente en la moneda local con la tasa del día que
 * pone el dueño en Mi tienda (como Treinta con dólares y bolívares).
 */
export function enMoneda2(monto: number, moneda2: string, tasa2: number): string | null {
  if (!moneda2 || !(tasa2 > 0)) return null;
  const valor = monto * tasa2;
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency: moneda2,
      maximumFractionDigits: valor >= 1000 ? 0 : 2,
    }).format(valor);
  } catch {
    // Un código de moneda que el navegador no conoce: se muestra igual, a mano.
    return `${moneda2} ${valor.toLocaleString("es", { maximumFractionDigits: 2 })}`;
  }
}

/** "$1,890" o "$1,890 · Bs 72.765" si hay segunda moneda. */
export function precioDoble(monto: number, moneda2: string, tasa2: number): string {
  const otra = enMoneda2(monto, moneda2, tasa2);
  return otra ? `${formatearPrecio(monto)} · ${otra}` : formatearPrecio(monto);
}
