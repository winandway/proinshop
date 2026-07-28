import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuración de OpenNext: convierte el build de Next.js en un Worker.
//
// Los tres en `undefined` son la configuración oficial de la guía de
// YaDominios Cloud (https://yadominios.com/docs/publicar-en-yadominios-cloud):
// sin ellos, OpenNext mete clases de Durable Objects (DOQueueHandler,
// DOShardedTagCache, BucketCachePurge) que la plataforma rechaza.
export default defineCloudflareConfig({
  incrementalCache: undefined,
  queue: undefined,
  tagCache: undefined,
});
