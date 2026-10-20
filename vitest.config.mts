import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    include: ["pruebas/**/*.test.{ts,tsx}"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      // Lo que necesita la base o el servidor se prueba en la copia local, no aquí.
      exclude: [
        "src/lib/catalogo-desarrollo.ts",
        "src/lib/d1.ts",
        "src/lib/esquema.ts",
        "src/lib/sesion.ts",
        "src/lib/idioma-servidor.ts",
      ],
      // Arranca donde estaba el 19 oct 2026 y solo puede subir (regla de
      // blindaje): si una prueba se borra o se agrega lógica sin prueba, rojo.
      thresholds: { lines: 33, functions: 29, branches: 35, statements: 34 },
    },
  },
});
