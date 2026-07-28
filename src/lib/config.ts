/**
 * Datos del negocio. En la Etapa 3 salen de la tabla `negocio` y se editan
 * desde "Mi tienda" en la app de administración, sin tocar código.
 */

export const NEGOCIO = {
  nombre: "Proinshop",
  dominio: "proinshop.com",
  url: "https://proinshop.com",
  /** Pendiente: el dueño debe dar el número real de ventas. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "",
  costoEnvio: 25,
} as const;

/** Arma el enlace de WhatsApp con el mensaje ya escrito. */
export function enlaceWhatsapp(mensaje: string): string {
  const texto = encodeURIComponent(mensaje);
  return NEGOCIO.whatsapp
    ? `https://wa.me/${NEGOCIO.whatsapp}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
}
