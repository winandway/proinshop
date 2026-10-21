import { describe, expect, it } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import { cambiarPorLista, enTrozos, filasPorLista } from "@/lib/por-trozos";
import { borrarProductos } from "@/lib/borrar-productos";

/**
 * Una base de mentira que se porta como la de la nube: rechaza cualquier
 * consulta con más de 100 valores, que fue lo que habría tumbado el catálogo
 * con más de cien productos.
 */
function baseDePrueba() {
  const sentencias: { sql: string; valores: unknown[] }[] = [];
  let lotes = 0;
  const preparar = (sql: string) => ({
    bind: (...valores: unknown[]) => {
      if (valores.length > 100) throw new Error(`too many SQL variables (${valores.length})`);
      const sentencia = { sql, valores };
      return {
        ...sentencia,
        all: async () => {
          sentencias.push(sentencia);
          return { results: valores.filter((v) => typeof v === "number").map((id) => ({ id })) };
        },
      };
    },
  });
  const db = {
    prepare: preparar,
    batch: async (lista: { sql: string; valores: unknown[] }[]) => {
      lotes += 1;
      sentencias.push(...lista.map(({ sql, valores }) => ({ sql, valores })));
      return [];
    },
  } as unknown as D1Database;
  return { db, sentencias, lotes: () => lotes };
}

const ids = Array.from({ length: 250 }, (_, i) => i + 1);

describe("listas largas por trozos", () => {
  it("parte la lista sin perder ni repetir nada", () => {
    const trozos = enTrozos(ids, 90);
    expect(trozos.map((t) => t.length)).toEqual([90, 90, 70]);
    expect(trozos.flat()).toEqual(ids);
    expect(enTrozos([], 90)).toEqual([]);
  });

  it("un SELECT con 250 productos pasa y devuelve todo", async () => {
    const { db, sentencias } = baseDePrueba();
    const filas = await filasPorLista<{ id: number }>(db, (m) => `SELECT * FROM variante WHERE producto_id IN (${m})`, ids);
    expect(filas.map((f) => f.id)).toEqual(ids);
    expect(sentencias.every((s) => s.valores.length <= 90)).toBe(true);
  });

  it("los valores de antes de la lista cuentan para el límite", async () => {
    const { db, sentencias } = baseDePrueba();
    await cambiarPorLista(db, (m) => `UPDATE producto SET precio = ROUND(precio * ?, 2) WHERE id IN (${m})`, ids, [1.1]);
    expect(sentencias.every((s) => s.valores.length <= 90 && s.valores[0] === 1.1)).toBe(true);
    expect(sentencias.flatMap((s) => s.valores.slice(1))).toEqual(ids);
  });
});

describe("borrar productos", () => {
  it("borra en orden, todo en un solo lote, sin pasar el límite", async () => {
    const { db, sentencias, lotes } = baseDePrueba();
    await borrarProductos(db, ids);
    expect(lotes()).toBe(1);
    // 3 trozos × 9 pasos; lo último de cada trozo es borrar el producto.
    expect(sentencias).toHaveLength(27);
    expect(sentencias[8]!.sql).toMatch(/^DELETE FROM producto WHERE id IN/);
    expect(sentencias[0]!.sql).toMatch(/^UPDATE venta_item SET producto_id = NULL/);
    expect(sentencias.every((s) => s.valores.length <= 90)).toBe(true);
  });

  it("sin productos no toca la base", async () => {
    const { db, lotes } = baseDePrueba();
    await borrarProductos(db, []);
    expect(lotes()).toBe(0);
  });
});
