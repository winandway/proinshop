/**
 * Deja el _worker.js con UN solo export: `default`.
 *
 * OpenNext exporta además tres clases de Durable Objects (BucketCachePurge,
 * DOQueueHandler, DOShardedTagCache) que no usamos y que YaDominios Cloud no
 * soporta: su plataforma puede rechazar o romperse con un worker que declare
 * clases de Durable Objects. Este script reescribe el bloque final de exports
 * y quita el comentario del sourcemap (el .map no se publica).
 *
 * Uso: node herramientas/limpiar-worker.js <ruta-al-worker.js>
 */

const fs = require("node:fs");

const ruta = process.argv[2];
if (!ruta) {
  console.error("Falta la ruta al worker.js");
  process.exit(1);
}

let codigo = fs.readFileSync(ruta, "utf8");

// El comentario apunta a un .map que no se publica; fuera.
codigo = codigo.replace(/\/\/# sourceMappingURL=\S*\s*$/, "");

// Último bloque `export { ... }` del archivo (esbuild siempre lo deja al final).
const bloque = /export\s*\{([^}]*)\}\s*;?\s*$/;
const encontrado = codigo.match(bloque);
if (!encontrado) {
  console.error("No se encontró el bloque de exports al final del worker");
  process.exit(1);
}

const exportDefault = encontrado[1]
  .split(",")
  .map((parte) => parte.trim())
  .find((parte) => /\sas\s+default$/.test(parte) || parte === "default");

if (!exportDefault) {
  console.error("El worker no tiene export default");
  process.exit(1);
}

codigo = codigo.replace(bloque, `export{${exportDefault}};\n`);
fs.writeFileSync(ruta, codigo);
console.log(`Worker limpio: solo queda "export{${exportDefault}}"`);
