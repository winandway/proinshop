import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Resultados del empaquetado para YaDominios Cloud: son generados.
    ".open-next/**",
    ".dist-worker/**",
    "out-deploy/**",
    // Generadores archivados de las imágenes de marca (ver herramientas/LEEME.md).
    "herramientas/**",
  ]),
]);

export default eslintConfig;
