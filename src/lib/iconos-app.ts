import type { MetadataRoute } from "next";

/** Android pide íconos de 192 y 512; los de máscara dejan margen para recortarlos. */
export const ICONOS_APP: MetadataRoute.Manifest["icons"] = [
  { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/iconos/icono-mascara-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/iconos/icono-mascara-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];
