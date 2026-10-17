import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La carpeta del proyecto es la raíz: evita que Turbopack tome como raíz
  // un lockfile que esté más arriba en el disco.
  turbopack: { root: path.resolve(".") },

  // Cada publicación lleva su huella. Si el dueño tiene el panel abierto
  // mientras se publica una versión nueva, al moverse la página se recarga
  // sola en vez de fallar con un botón que ya no existe.
  deploymentId: process.env.GITHUB_SHA?.slice(0, 12),

  experimental: {
    serverActions: {
      // Por defecto Next solo acepta 1 MB por envío y una foto de celular
      // pesa de 2 a 6 MB: crear un producto con foto fallaba. El navegador
      // ya achica la foto antes de subirla; este margen cubre al que no puede.
      bodySizeLimit: "20mb",
    },
  },

  async rewrites() {
    return [
      // El manual vive en public/guia/index.html. Con esto el enlace que se
      // comparte es limpio: proinshop.com/guia#crear-producto
      { source: "/guia", destination: "/guia/index.html" },
      { source: "/manual", destination: "/guia/index.html" },
    ];
  },
};

export default nextConfig;
