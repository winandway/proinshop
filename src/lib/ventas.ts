/**
 * Reglas de cobro de una venta, sin base ni pantalla: así se pueden probar
 * solas.
 */

export const METODOS_VALIDOS = ["efectivo", "transferencia", "tarjeta", "fiado"] as const;

export type PagoVenta = { metodo: string; monto: number };

export type Cobro =
  | { error: string }
  | { pagos: PagoVenta[]; metodo: string; fiado: number };

const centavos = (valor: number) => Math.round(valor * 100);

/**
 * Pago simple: un método por el total. Pago mixto: varios métodos que tienen
 * que sumar exactamente el total. El fiado puede ser parte del pago mixto y
 * esa parte queda como deuda.
 */
export function repartirPagos(entrada: unknown, total: number): Cobro {
  const lista = Array.isArray(entrada) ? entrada : [];
  const limpios: PagoVenta[] = lista
    .map((pago) => ({
      metodo: String((pago as PagoVenta)?.metodo ?? ""),
      monto: Number((pago as PagoVenta)?.monto) || 0,
    }))
    .filter((pago) => (METODOS_VALIDOS as readonly string[]).includes(pago.metodo));

  if (limpios.length === 0) return { error: "Elige cómo te pagaron" };

  // Un solo método cubre el total, diga lo que diga el navegador.
  if (limpios.length === 1) {
    const unico = limpios[0]!;
    return {
      pagos: [{ metodo: unico.metodo, monto: total }],
      metodo: unico.metodo,
      fiado: unico.metodo === "fiado" ? total : 0,
    };
  }

  // Varios: se juntan los del mismo método y se exige que cuadren.
  const porMetodo = new Map<string, number>();
  for (const pago of limpios) {
    if (pago.monto <= 0) continue;
    porMetodo.set(pago.metodo, (porMetodo.get(pago.metodo) ?? 0) + pago.monto);
  }
  const pagos = [...porMetodo].map(([metodo, monto]) => ({ metodo, monto: centavos(monto) / 100 }));
  if (pagos.length === 0) return { error: "Escribe cuánto se pagó con cada método" };

  const suma = pagos.reduce((acumulado, pago) => acumulado + centavos(pago.monto), 0);
  if (suma !== centavos(total)) {
    return {
      error: `Los pagos suman ${(suma / 100).toFixed(2)} y la venta es de ${total.toFixed(2)}`,
    };
  }

  return {
    pagos,
    metodo: pagos.length === 1 ? pagos[0]!.metodo : "mixto",
    fiado: pagos.find((pago) => pago.metodo === "fiado")?.monto ?? 0,
  };
}

/** Hasta cuántos días atrás se acepta una venta hecha sin señal. */
const DIAS_SIN_SENAL = 7;

/**
 * La fecha de una venta que se hizo sin señal y llega después. Cuenta la hora
 * en que se vendió, no la hora en que volvió el internet. Si la fecha no es
 * creíble (del futuro o de hace semanas), vale la hora de llegada: así nadie
 * puede meter ventas con fechas viejas para descuadrar un cierre.
 */
export function fechaDeVentaSinSenal(texto: unknown, ahora = new Date()): string | null {
  if (typeof texto !== "string" || !texto) return null;
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return null;
  const diferencia = ahora.getTime() - fecha.getTime();
  if (diferencia < -5 * 60_000 || diferencia > DIAS_SIN_SENAL * 86_400_000) return null;
  // El formato de la base: «2026-10-19 14:05:00», en hora universal.
  return fecha.toISOString().slice(0, 19).replace("T", " ");
}

/** La llave que evita guardar dos veces la misma venta si se reenvía. */
export function claveDeVentaValida(texto: unknown): string | null {
  if (typeof texto !== "string") return null;
  return /^[A-Za-z0-9-]{8,64}$/.test(texto) ? texto : null;
}
