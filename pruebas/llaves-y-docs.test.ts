import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { nombreDelDispositivo, sitioDeLlave } from "@/lib/llaves";
import { GUIAS, SECCIONES_DOCS, normalizarBusqueda, textoPlano } from "@/lib/docs";

describe("llaves de acceso: solo en los dominios propios", () => {
  it("proinshop.com y www comparten la misma llave", () => {
    expect(sitioDeLlave("https://proinshop.com")).toEqual({ rpID: "proinshop.com", origen: "https://proinshop.com" });
    expect(sitioDeLlave("https://www.proinshop.com")).toEqual({
      rpID: "proinshop.com",
      origen: "https://www.proinshop.com",
    });
  });

  it("en la computadora de pruebas sirve sin candado", () => {
    expect(sitioDeLlave("http://localhost:8830")).toEqual({ rpID: "localhost", origen: "http://localhost:8830" });
  });

  it("otros dominios o sin https: no", () => {
    expect(sitioDeLlave("https://proinshop.com.evil.net")).toBeNull();
    expect(sitioDeLlave("http://proinshop.com")).toBeNull();
    expect(sitioDeLlave("no es una dirección")).toBeNull();
    expect(sitioDeLlave(null)).toBeNull();
  });

  it("nombra el dispositivo para la lista de Mi cuenta", () => {
    expect(nombreDelDispositivo("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("iPhone");
    expect(nombreDelDispositivo("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe("Celular Android");
    expect(nombreDelDispositivo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("Mac");
    expect(nombreDelDispositivo(undefined)).toBe("Este dispositivo");
  });
});

describe("Docs: cada guía completa, en los dos idiomas", () => {
  it("las direcciones son únicas y en inglés", () => {
    const slugs = GUIAS.map((guia) => guia.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("todo texto existe en español y en inglés", () => {
    for (const guia of GUIAS) {
      for (const idioma of ["es", "en"] as const) {
        expect(guia.titulo[idioma].trim(), `${guia.slug} título ${idioma}`).not.toBe("");
        expect(guia.resumen[idioma].trim(), `${guia.slug} resumen ${idioma}`).not.toBe("");
        expect(textoPlano(guia, idioma).length).toBeGreaterThan(200);
      }
      expect(guia.titulo.es).not.toBe(guia.titulo.en);
    }
  });

  it("cada guía está en una sección que existe y sus relacionadas existen", () => {
    const secciones = new Set(SECCIONES_DOCS.map((s) => s.id));
    const slugs = new Set(GUIAS.map((guia) => guia.slug));
    for (const guia of GUIAS) {
      expect(secciones.has(guia.seccion)).toBe(true);
      for (const otra of guia.relacionadas ?? []) expect(slugs.has(otra), `${guia.slug} → ${otra}`).toBe(true);
    }
  });

  it("cada captura que se nombra existe de verdad", () => {
    for (const guia of GUIAS) {
      for (const bloque of guia.bloques) {
        if (bloque.tipo !== "captura") continue;
        const archivo = path.join(process.cwd(), "public", "capturas", bloque.archivo);
        expect(fs.existsSync(archivo), `${guia.slug}: falta ${bloque.archivo}`).toBe(true);
      }
    }
  });

  it("la búsqueda no distingue acentos ni mayúsculas", () => {
    expect(normalizarBusqueda("Cotización")).toBe("cotizacion");
  });
});
