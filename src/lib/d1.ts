/**
 * Acceso a los recursos que da YaDominios Cloud al worker:
 * `env.DB` (base SQLite) y `env.BUCKET` (archivos).
 *
 * En local, si no se levantó el entorno de Cloudflare, no hay bindings: las
 * funciones devuelven null y quien las llama cae al catálogo de desarrollo.
 * Así `npm run dev` sigue funcionando sin depender de la nube.
 */

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

type Entorno = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
};

async function entorno(): Promise<Entorno | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const contexto = await getCloudflareContext({ async: true });
    return (contexto?.env ?? null) as Entorno | null;
  } catch {
    // Fuera del worker (por ejemplo `next dev` sin bindings).
    return null;
  }
}

export async function baseDeDatos(): Promise<D1Database | null> {
  const env = await entorno();
  return env?.DB ?? null;
}

export async function bucket(): Promise<R2Bucket | null> {
  const env = await entorno();
  return env?.BUCKET ?? null;
}
