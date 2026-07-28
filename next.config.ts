import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La carpeta del proyecto es la raíz: evita que Turbopack tome como raíz
  // un lockfile que esté más arriba en el disco.
  turbopack: { root: path.resolve(".") },

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
