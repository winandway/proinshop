import type { D1Database } from "@cloudflare/workers-types";

/**
 * La base de la nube acepta como mucho 100 valores por consulta. Una lista
 * más larga (el catálogo con más de cien productos, una edición masiva de
 * doscientos) hacía fallar la consulta entera: la tienda no cargaba. Aquí se
 * parte en trozos con margen y se juntan los resultados.
 */
export const VALORES_POR_CONSULTA = 90;

export function enTrozos<T>(lista: readonly T[], tamano = VALORES_POR_CONSULTA): T[][] {
  const paso = Math.max(1, Math.floor(tamano));
  const trozos: T[][] = [];
  for (let i = 0; i < lista.length; i += paso) trozos.push(lista.slice(i, i + paso));
  return trozos;
}

export const marcasPara = (cantidad: number) => Array.from({ length: cantidad }, () => "?").join(",");

type Valor = string | number | null;

/**
 * Un SELECT con `IN (...)` sobre una lista de cualquier largo. `armar` recibe
 * las marcas del trozo; `antes` son los valores que van antes de la lista.
 */
export async function filasPorLista<T>(
  db: D1Database,
  armar: (marcas: string) => string,
  lista: readonly Valor[],
  antes: readonly Valor[] = [],
): Promise<T[]> {
  if (lista.length === 0) return [];
  const respuestas = await Promise.all(
    enTrozos(lista, VALORES_POR_CONSULTA - antes.length).map((trozo) =>
      db
        .prepare(armar(marcasPara(trozo.length)))
        .bind(...antes, ...trozo)
        .all<T>(),
    ),
  );
  return respuestas.flatMap((respuesta) => respuesta.results);
}

/** Un UPDATE o DELETE con `IN (...)`: todos los trozos van juntos, o ninguno. */
export async function cambiarPorLista(
  db: D1Database,
  armar: (marcas: string) => string,
  lista: readonly Valor[],
  antes: readonly Valor[] = [],
): Promise<void> {
  if (lista.length === 0) return;
  await db.batch(
    enTrozos(lista, VALORES_POR_CONSULTA - antes.length).map((trozo) =>
      db.prepare(armar(marcasPara(trozo.length))).bind(...antes, ...trozo),
    ),
  );
}
