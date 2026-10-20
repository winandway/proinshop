import { describe, expect, it } from "vitest";
import { leerMonto } from "@/lib/numeros";

describe("leerMonto: los montos se leen como los escribe una persona", () => {
  it("un punto seguido de tres cifras es de miles (el error de 1.890 → 1,89)", () => {
    expect(leerMonto("1.890")).toBe(1890);
    expect(leerMonto("12.500.000")).toBe(12500000);
    expect(leerMonto("1,890")).toBe(1890);
  });

  it("con punto y coma, el último es el decimal", () => {
    expect(leerMonto("1.890,50")).toBe(1890.5);
    expect(leerMonto("1,890.50")).toBe(1890.5);
  });

  it("decimales normales", () => {
    expect(leerMonto("19.99")).toBe(19.99);
    expect(leerMonto("0.500")).toBe(0.5);
    expect(leerMonto("25,5")).toBe(25.5);
  });

  it("ignora símbolos y espacios, y nunca devuelve NaN", () => {
    expect(leerMonto("$ 1.200")).toBe(1200);
    expect(leerMonto("")).toBe(0);
    expect(leerMonto(null)).toBe(0);
    expect(leerMonto("abc")).toBe(0);
    expect(leerMonto("-15")).toBe(-15);
  });
});
