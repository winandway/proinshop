import { describe, expect, it } from "vitest";
import { costoPromedio, estaPorAgotarse } from "@/lib/inventario";
import { diferenciaCaja, efectivoEsperado } from "@/lib/caja";

describe("costoPromedio: el costo después de una compra", () => {
  it("promedia lo que había con lo que llegó", () => {
    expect(costoPromedio(10, 100, 10, 120)).toBe(110);
    expect(costoPromedio(10, 100, 8, 125)).toBe(111.11);
  });

  it("sin existencias, vale el costo de la compra", () => {
    expect(costoPromedio(0, 100, 5, 130)).toBe(130);
    expect(costoPromedio(-3, 100, 5, 130)).toBe(130);
  });

  it("una compra de cero unidades no cambia nada", () => {
    expect(costoPromedio(10, 100, 0, 999)).toBe(100);
  });
});

describe("estaPorAgotarse", () => {
  it("usa el mínimo del producto y, si no tiene, el general", () => {
    expect(estaPorAgotarse(4, 5, 3)).toBe(true);
    expect(estaPorAgotarse(4, 0, 3)).toBe(false);
    expect(estaPorAgotarse(3, 0, 3)).toBe(true);
  });

  it("los servicios nunca se agotan", () => {
    expect(estaPorAgotarse(0, 0, 3, true)).toBe(false);
  });
});

describe("caja: efectivo esperado y diferencia al cerrar", () => {
  const movimientos = {
    ventas: { efectivo: 500, transferencia: 300 },
    abonos: { efectivo: 50 },
    gastos: { efectivo: 120, tarjeta: 40 },
    compras: { efectivo: 200 },
  };

  it("suma lo que entró en efectivo y resta lo que salió en efectivo", () => {
    // 50 inicial + 500 + 50 − 120 − 200 = 280
    expect(efectivoEsperado(50, movimientos)).toBe(280);
  });

  it("lo que no es efectivo no toca el cajón", () => {
    expect(efectivoEsperado(0, { ventas: { tarjeta: 999 }, abonos: {}, gastos: {}, compras: {} })).toBe(0);
  });

  it("dice cuánto falta o sobra, al centavo", () => {
    expect(diferenciaCaja(270, 280)).toBe(-10);
    expect(diferenciaCaja(280.1, 280)).toBe(0.1);
    expect(diferenciaCaja(280, 280)).toBe(0);
  });
});
