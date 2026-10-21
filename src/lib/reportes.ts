/**
 * Filtros de los reportes, como en Treinta: por fechas, empleado, método de
 * pago, producto y canal. Arma el pedazo de consulta y sus valores; las
 * fechas se cortan con la hora del negocio.
 */

export type FiltrosReporte = {
  desde: string;
  hasta: string;
  empleado: number | null;
  metodo: string | null;
  producto: number | null;
  canal: string | null;
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Lee los filtros de la dirección; por defecto, el mes en curso. */
export function leerFiltros(
  parametros: Record<string, string | undefined>,
  hoyLocal: string,
): FiltrosReporte {
  const inicioMes = `${hoyLocal.slice(0, 7)}-01`;
  const desde = parametros.desde && FECHA.test(parametros.desde) ? parametros.desde : inicioMes;
  const hasta = parametros.hasta && FECHA.test(parametros.hasta) ? parametros.hasta : hoyLocal;
  return {
    desde: desde <= hasta ? desde : hasta,
    hasta: desde <= hasta ? hasta : desde,
    empleado: Number(parametros.empleado) || null,
    metodo: ["efectivo", "transferencia", "tarjeta", "fiado", "contraentrega"].includes(parametros.metodo ?? "")
      ? (parametros.metodo as string)
      : null,
    producto: Number(parametros.producto) || null,
    canal: parametros.canal === "local" || parametros.canal === "web" ? parametros.canal : null,
  };
}

/**
 * Condición para la tabla de ventas (alias v). `zona` es el modificador de
 * hora ya validado ("'-300 minutes'"), nunca texto del usuario.
 */
export function condicionVentas(filtros: FiltrosReporte, zona: string): { sql: string; valores: (string | number)[] } {
  const partes = [`COALESCE(v.anulada, 0) = 0`, `date(v.fecha, ${zona}) BETWEEN ? AND ?`];
  const valores: (string | number)[] = [filtros.desde, filtros.hasta];
  if (filtros.empleado) {
    partes.push("v.usuario_id = ?");
    valores.push(filtros.empleado);
  }
  if (filtros.canal) {
    partes.push("v.canal = ?");
    valores.push(filtros.canal);
  }
  if (filtros.metodo) {
    partes.push("EXISTS (SELECT 1 FROM venta_pago fp WHERE fp.venta_id = v.id AND fp.metodo = ?)");
    valores.push(filtros.metodo);
  }
  if (filtros.producto) {
    partes.push("EXISTS (SELECT 1 FROM venta_item fi WHERE fi.venta_id = v.id AND fi.producto_id = ?)");
    valores.push(filtros.producto);
  }
  return { sql: partes.join(" AND "), valores };
}

/** Lo mismo para gastos (alias g): solo fechas, empleado no aplica. */
export function condicionGastos(filtros: FiltrosReporte, zona: string): { sql: string; valores: string[] } {
  return { sql: `date(g.fecha, ${zona}) BETWEEN ? AND ?`, valores: [filtros.desde, filtros.hasta] };
}

/** Para enlaces y descargas: los filtros otra vez como dirección. */
export function filtrosEnDireccion(filtros: FiltrosReporte): string {
  const parametros = new URLSearchParams({ desde: filtros.desde, hasta: filtros.hasta });
  if (filtros.empleado) parametros.set("empleado", String(filtros.empleado));
  if (filtros.metodo) parametros.set("metodo", filtros.metodo);
  if (filtros.producto) parametros.set("producto", String(filtros.producto));
  if (filtros.canal) parametros.set("canal", filtros.canal);
  return parametros.toString();
}

/** "2026-10-19" en la hora del negocio. */
export function hoyEnZona(minutos: number): string {
  return new Date(Date.now() + minutos * 60_000).toISOString().slice(0, 10);
}

const DIA_MS = 86_400_000;
const aFecha = (texto: string) => new Date(`${texto}T00:00:00Z`);
const aTexto = (fecha: Date) => fecha.toISOString().slice(0, 10);

/**
 * El período de antes, del mismo largo: si se mira del 1 al 31 de octubre, se
 * compara con los 31 días anteriores. Así se ve si el negocio va mejor o peor.
 */
export function periodoAnterior(desde: string, hasta: string): { desde: string; hasta: string } {
  const inicio = aFecha(desde);
  const fin = aFecha(hasta);
  const dias = Math.round((fin.getTime() - inicio.getTime()) / DIA_MS) + 1;
  const finAnterior = new Date(inicio.getTime() - DIA_MS);
  const inicioAnterior = new Date(finAnterior.getTime() - (dias - 1) * DIA_MS);
  return { desde: aTexto(inicioAnterior), hasta: aTexto(finAnterior) };
}

/** Cuánto subió o bajó, en porcentaje entero. Sin base para comparar, null. */
export function cambioPorcentual(actual: number, anterior: number): number | null {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / Math.abs(anterior)) * 100);
}
