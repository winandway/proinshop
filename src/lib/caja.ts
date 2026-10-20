import type { D1Database } from "@cloudflare/workers-types";

/**
 * Cuentas de la caja.
 *
 * Desde que se abre, entra plata por ventas y abonos y sale por gastos y
 * compras. El efectivo esperado es lo que debería haber en el cajón: el monto
 * con que se abrió, más lo que entró en efectivo, menos lo que salió en
 * efectivo. Al cerrar se cuenta lo que hay y la diferencia dice si falta o
 * sobra.
 */

export type PorMetodo = Record<string, number>;

export type MovimientosCaja = {
  ventas: PorMetodo;
  abonos: PorMetodo;
  gastos: PorMetodo;
  compras: PorMetodo;
};

const redondear = (valor: number) => Math.round(valor * 100) / 100;

export function efectivoEsperado(inicial: number, movimientos: MovimientosCaja): number {
  const efectivo = (grupo: PorMetodo) => grupo.efectivo ?? 0;
  return redondear(
    inicial +
      efectivo(movimientos.ventas) +
      efectivo(movimientos.abonos) -
      efectivo(movimientos.gastos) -
      efectivo(movimientos.compras),
  );
}

export function diferenciaCaja(contado: number, esperado: number): number {
  return redondear(contado - esperado);
}

function agrupar(filas: { metodo: string | null; total: number }[]): PorMetodo {
  const grupo: PorMetodo = {};
  for (const fila of filas) {
    const metodo = fila.metodo || "efectivo";
    grupo[metodo] = redondear((grupo[metodo] ?? 0) + fila.total);
  }
  return grupo;
}

/** Lo que se movió desde que se abrió la caja (o entre dos momentos). */
export async function movimientosDesde(
  db: D1Database,
  desde: string,
  hasta: string | null,
): Promise<MovimientosCaja> {
  const limite = hasta ? " AND fecha <= ?" : "";
  const extra = hasta ? [hasta] : [];
  const [ventas, abonos, gastos, compras] = await Promise.all([
    db
      .prepare(
        `SELECT p.metodo AS metodo, SUM(p.monto) AS total
         FROM venta_pago p JOIN venta v ON v.id = p.venta_id
         WHERE COALESCE(v.anulada, 0) = 0 AND p.metodo != 'fiado' AND v.fecha >= ?${limite.replace("fecha", "v.fecha")}
         GROUP BY p.metodo`,
      )
      .bind(desde, ...extra)
      .all<{ metodo: string; total: number }>(),
    db
      .prepare(`SELECT metodo_pago AS metodo, SUM(monto) AS total FROM abono WHERE fecha >= ?${limite} GROUP BY metodo_pago`)
      .bind(desde, ...extra)
      .all<{ metodo: string | null; total: number }>(),
    db
      .prepare(`SELECT metodo_pago AS metodo, SUM(monto) AS total FROM gasto WHERE fecha >= ?${limite} GROUP BY metodo_pago`)
      .bind(desde, ...extra)
      .all<{ metodo: string | null; total: number }>(),
    db
      .prepare(
        `SELECT metodo_pago AS metodo, SUM(total) AS total FROM compra
         WHERE fecha >= ?${limite} AND metodo_pago IS NOT NULL AND metodo_pago != 'credito'
         GROUP BY metodo_pago`,
      )
      .bind(desde, ...extra)
      .all<{ metodo: string | null; total: number }>(),
  ]);

  return {
    ventas: agrupar(ventas.results),
    abonos: agrupar(abonos.results),
    gastos: agrupar(gastos.results),
    compras: agrupar(compras.results),
  };
}

export type CajaAbierta = { id: number; abierta_en: string; monto_inicial: number; abierta_por: string | null };

export async function cajaAbierta(db: D1Database): Promise<CajaAbierta | null> {
  return db
    .prepare(
      `SELECT c.id, c.abierta_en, c.monto_inicial, u.nombre AS abierta_por
       FROM caja c LEFT JOIN usuario u ON u.id = c.abierta_por
       WHERE c.cerrada_en IS NULL ORDER BY c.id DESC LIMIT 1`,
    )
    .first<CajaAbierta>();
}
