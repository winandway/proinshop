/**
 * Los primeros pasos del dueño, como el recorrido de bienvenida de Treinta:
 * lo mínimo para dejar el negocio andando. Cada paso se marca solo, mirando
 * lo que ya hizo, sin que tenga que tocar nada.
 */

export type DatosPasos = {
  whatsapp: string;
  productos: number;
  ventas: number;
  cajas: number;
  personas: number;
  huellas: number;
  avisos: number;
};

export type Paso = { clave: string; texto: string; enlace: string; hecho: boolean };

export function primerosPasos(datos: DatosPasos): Paso[] {
  return [
    { clave: "tienda", texto: "Pon el WhatsApp de ventas en Mi tienda", enlace: "/panel/tienda", hecho: datos.whatsapp.replace(/\D/g, "").length >= 7 },
    { clave: "productos", texto: "Carga tus productos", enlace: "/panel/inventario", hecho: datos.productos > 0 },
    { clave: "caja", texto: "Abre la caja del día", enlace: "/panel/caja", hecho: datos.cajas > 0 },
    { clave: "venta", texto: "Registra tu primera venta", enlace: "/panel/vender", hecho: datos.ventas > 0 },
    { clave: "equipo", texto: "Invita a tu equipo", enlace: "/panel/equipo", hecho: datos.personas > 1 },
    { clave: "huella", texto: "Activa la entrada con huella o cara", enlace: "/panel/cuenta", hecho: datos.huellas > 0 },
    { clave: "avisos", texto: "Activa los avisos en tu celular", enlace: "/panel/cuenta", hecho: datos.avisos > 0 },
  ];
}

/** Qué tanto lleva, de 0 a 100. */
export function avance(pasos: Paso[]): number {
  if (pasos.length === 0) return 100;
  return Math.round((pasos.filter((paso) => paso.hecho).length / pasos.length) * 100);
}
