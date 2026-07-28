import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA. Con esto la tienda se puede "instalar" en el celular
 * y abrir a pantalla completa, como una aplicación. En la Etapa 3 la app de
 * administración usa el mismo manifiesto con `start_url: "/admin"`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Proinshop — Importación directa",
    short_name: "Proinshop",
    description:
      "Plantas eléctricas, motos, bicicletas, herramientas y repuestos importados directamente de fábrica.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ff2d2d",
    lang: "es",
    categories: ["shopping", "business"],
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
}
