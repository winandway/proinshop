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

  // La misma huella llega al navegador: con ella el modo sin señal sabe
  // cuándo borrar las copias de la versión anterior.
  env: { NEXT_PUBLIC_VERSION: process.env.GITHUB_SHA?.slice(0, 12) ?? "local" },

  experimental: {
    serverActions: {
      // Por defecto Next solo acepta 1 MB por envío y una foto de celular
      // pesa de 2 a 6 MB: crear un producto con foto fallaba. El navegador
      // ya achica la foto antes de subirla; este margen cubre al que no puede.
      bodySizeLimit: "20mb",
    },
  },

  async redirects() {
    return [
      // El manual de una sola página se reemplazó por Docs (una guía por
      // página). Los enlaces viejos que ya circularon llegan a Docs.
      { source: "/guia", destination: "/docs", permanent: true },
      { source: "/guia/:resto*", destination: "/docs", permanent: true },
      { source: "/manual", destination: "/docs", permanent: true },
    ];
  },
};

export default nextConfig;
