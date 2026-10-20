import { describe, expect, it } from "vitest";
import { detectarSeparador, escribirCsv, leerCsv, normalizarEncabezado } from "@/lib/csv";
import { leerFiltros } from "@/lib/reportes";
import { enMoneda2 } from "@/lib/moneda";
import { horaLocal } from "@/lib/zona";

describe("Excel (CSV)", () => {
  it("detecta punto y coma (Excel en español) y coma (en inglés)", () => {
    expect(detectarSeparador("nombre;precio;stock\nA;1;2")).toBe(";");
    expect(detectarSeparador("name,price,stock\nA,1,2")).toBe(",");
    expect(detectarSeparador("a\tb\tc")).toBe("\t");
  });

  it("respeta comillas, separadores y saltos de línea dentro de una celda", () => {
    const filas = leerCsv('﻿nombre;descripcion\r\n"Planta; 3.5 kW";"Línea 1\nLínea 2 con ""comillas"""\r\n;\r\n');
    expect(filas).toEqual([
      ["nombre", "descripcion"],
      ["Planta; 3.5 kW", 'Línea 1\nLínea 2 con "comillas"'],
    ]);
  });

  it("lo que escribe se vuelve a leer igual", () => {
    const original = [
      ["Nombre", "Precio"],
      ['Taladro "pro"', "1.890,50"],
      ["Con; separador", ""],
    ];
    const texto = escribirCsv(original);
    expect(texto.startsWith("﻿")).toBe(true);
    expect(leerCsv(texto)).toEqual(original);
  });

  it("reconoce encabezados escritos a mano", () => {
    expect(normalizarEncabezado("  Código de Barras ")).toBe("codigo_de_barras");
    expect(normalizarEncabezado("Precio ($)")).toBe("precio");
  });
});

describe("filtros de reportes", () => {
  it("por defecto, el mes en curso hasta hoy", () => {
    expect(leerFiltros({}, "2026-10-19")).toMatchObject({ desde: "2026-10-01", hasta: "2026-10-19" });
  });

  it("si las fechas vienen al revés, se ordenan", () => {
    expect(leerFiltros({ desde: "2026-10-10", hasta: "2026-10-01" }, "2026-10-19")).toMatchObject({
      desde: "2026-10-01",
      hasta: "2026-10-10",
    });
  });

  it("valores inventados se ignoran", () => {
    const filtros = leerFiltros({ desde: "ayer", metodo: "regalo", canal: "tele", empleado: "x" }, "2026-10-19");
    expect(filtros).toMatchObject({ desde: "2026-10-01", metodo: null, canal: null, empleado: null });
  });
});

describe("segunda moneda y hora del negocio", () => {
  it("sin moneda o sin tasa no muestra nada", () => {
    expect(enMoneda2(100, "", 40)).toBeNull();
    expect(enMoneda2(100, "VES", 0)).toBeNull();
  });

  it("convierte con la tasa del día", () => {
    expect(enMoneda2(10, "VES", 38.5)).toContain("385");
  });

  it("pasa la hora universal a la hora del negocio", () => {
    expect(horaLocal("2026-10-20 03:30:00", -300)).toBe("2026-10-19 22:30");
  });
});
