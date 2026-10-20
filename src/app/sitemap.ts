import type { MetadataRoute } from "next";
import { NEGOCIO } from "@/lib/config";
import { GUIAS } from "@/lib/docs";
import { obtenerCategorias, obtenerProductos } from "@/lib/catalogo";

// Se arma en cada visita del buscador: los productos cambian todos los días.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = NEGOCIO.url;
  const fijas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/docs`, changeFrequency: "weekly", priority: 0.6 },
    ...GUIAS.map((guia) => ({
      url: `${base}/docs/${guia.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  try {
    const [categorias, productos] = await Promise.all([obtenerCategorias(), obtenerProductos()]);
    return [
      ...fijas,
      ...categorias.map((categoria) => ({
        url: `${base}/categoria/${categoria.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...productos.map((producto) => ({
        url: `${base}/producto/${producto.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    // Sin base, al menos las páginas fijas: nunca un mapa vacío.
    console.error("Proinshop: el mapa del sitio salió sin productos", error);
    return fijas;
  }
}
