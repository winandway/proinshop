import type { MetadataRoute } from "next";
import { ICONOS_APP } from "@/lib/iconos-app";


/**
 * Manifiesto de la tienda instalable: se agrega al celular y abre a pantalla
 * completa, como una aplicación. El panel tiene el suyo
 * (src/app/panel/manifest.webmanifest), que abre directo en el panel.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Proinshop — Importación directa",
    short_name: "Proinshop",
    description:
      "Plantas eléctricas, motos, bicicletas, herramientas y repuestos importados directamente de fábrica.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ff2d2d",
    lang: "es",
    categories: ["shopping", "business"],
    icons: ICONOS_APP,
  };
}
