import { describe, expect, it } from "vitest";
import { avance, primerosPasos } from "@/lib/primeros-pasos";
import { cambioPorcentual, periodoAnterior } from "@/lib/reportes";

describe("primeros pasos del dueño", () => {
  const nada = { whatsapp: "", productos: 0, ventas: 0, cajas: 0, personas: 1, huellas: 0, avisos: 0 };

  it("al empezar no hay nada hecho", () => {
    const pasos = primerosPasos(nada);
    expect(pasos.every((paso) => !paso.hecho)).toBe(true);
    expect(avance(pasos)).toBe(0);
  });

  it("se marcan solos según lo que ya hizo", () => {
    const pasos = primerosPasos({ ...nada, whatsapp: "+58 412-555-0100", productos: 3, ventas: 1, personas: 2 });
    const hechos = Object.fromEntries(pasos.map((paso) => [paso.clave, paso.hecho]));
    expect(hechos).toMatchObject({ tienda: true, productos: true, venta: true, equipo: true, caja: false, huella: false });
    expect(avance(pasos)).toBe(57);
  });

  it("todo hecho es 100", () => {
    const pasos = primerosPasos({ whatsapp: "4125550100", productos: 1, ventas: 1, cajas: 1, personas: 2, huellas: 1, avisos: 1 });
    expect(avance(pasos)).toBe(100);
  });
});

describe("comparar con el período anterior", () => {
  it("un mes se compara con los mismos días justo antes", () => {
    expect(periodoAnterior("2026-10-01", "2026-10-31")).toEqual({ desde: "2026-08-31", hasta: "2026-09-30" });
  });

  it("un solo día se compara con el día anterior", () => {
    expect(periodoAnterior("2026-10-19", "2026-10-19")).toEqual({ desde: "2026-10-18", hasta: "2026-10-18" });
  });

  it("cruza años sin problema", () => {
    expect(periodoAnterior("2027-01-01", "2027-01-07")).toEqual({ desde: "2026-12-25", hasta: "2026-12-31" });
  });

  it("dice cuánto subió o bajó", () => {
    expect(cambioPorcentual(150, 100)).toBe(50);
    expect(cambioPorcentual(80, 100)).toBe(-20);
    expect(cambioPorcentual(100, 0)).toBeNull();
    expect(cambioPorcentual(-50, -100)).toBe(50);
  });
});
