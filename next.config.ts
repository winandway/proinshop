import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La carpeta del proyecto es la raíz: evita que Turbopack tome como raíz
  // un lockfile que esté más arriba en el disco.
  turbopack: { root: path.resolve(".") },
};

export default nextConfig;
