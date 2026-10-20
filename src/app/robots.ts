import type { MetadataRoute } from "next";
import { NEGOCIO } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    // El panel es privado: no tiene nada que hacer en un buscador.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panel", "/carrito", "/checkout", "/pedido", "/cotizacion"] }],
    sitemap: `${NEGOCIO.url}/sitemap.xml`,
  };
}
