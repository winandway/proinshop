/** Listas fijas del panel: sirven igual en el navegador y en el servidor. */

export const METODOS_PAGO = [
  { valor: "efectivo", texto: "💵 Efectivo" },
  { valor: "transferencia", texto: "🏦 Transferencia" },
  { valor: "tarjeta", texto: "💳 Tarjeta" },
  { valor: "fiado", texto: "🕐 Fiado" },
] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number]["valor"];

/** Nombre de cada método para comprobantes y reportes. */
export const NOMBRE_METODO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  fiado: "Fiado",
  contraentrega: "Paga al recibir",
  mixto: "Mixto",
};

export const CATEGORIAS_GASTO = [
  "Importación",
  "Mercancía",
  "Arriendo",
  "Servicios",
  "Nómina",
  "Transporte",
  "Otra",
] as const;
