import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuración de OpenNext: convierte el build de Next.js en un Worker.
// El resultado (.open-next/worker.js) lo empaqueta la GitHub Action en un
// solo _worker.js, que es lo único que acepta YaDominios Cloud.
export default defineCloudflareConfig();
