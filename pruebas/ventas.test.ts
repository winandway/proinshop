import { describe, expect, it } from "vitest";
import { claveDeVentaValida, fechaDeVentaSinSenal, repartirPagos } from "@/lib/ventas";

describe("repartirPagos: cómo se cobró una venta", () => {
  it("un solo método cubre el total aunque el navegador mande otro monto", () => {
    expect(repartirPagos([{ metodo: "efectivo", monto: 5 }], 120)).toEqual({
      pagos: [{ metodo: "efectivo", monto: 120 }],
      metodo: "efectivo",
      fiado: 0,
    });
  });

  it("todo fiado deja el total como deuda", () => {
    const cobro = repartirPagos([{ metodo: "fiado", monto: 0 }], 80);
    expect(cobro).toMatchObject({ metodo: "fiado", fiado: 80 });
  });

  it("pago mixto: tiene que cuadrar al centavo", () => {
    const cobro = repartirPagos(
      [
        { metodo: "efectivo", monto: 500 },
        { metodo: "fiado", monto: 700 },
      ],
      1200,
    );
    expect(cobro).toEqual({
      pagos: [
        { metodo: "efectivo", monto: 500 },
        { metodo: "fiado", monto: 700 },
      ],
      metodo: "mixto",
      fiado: 700,
    });
  });

  it("pago mixto que no cuadra se rechaza con el motivo", () => {
    const cobro = repartirPagos(
      [
        { metodo: "efectivo", monto: 500 },
        { metodo: "tarjeta", monto: 600 },
      ],
      1200,
    );
    expect(cobro).toEqual({ error: "Los pagos suman 1100.00 y la venta es de 1200.00" });
  });

  it("los centavos de coma flotante no rompen la cuenta", () => {
    const cobro = repartirPagos(
      [
        { metodo: "efectivo", monto: 0.1 },
        { metodo: "tarjeta", monto: 0.2 },
      ],
      0.3,
    );
    expect(cobro).not.toHaveProperty("error");
  });

  it("métodos inventados se ignoran", () => {
    expect(repartirPagos([{ metodo: "regalo", monto: 10 }], 10)).toEqual({ error: "Elige cómo te pagaron" });
    expect(repartirPagos("basura", 10)).toEqual({ error: "Elige cómo te pagaron" });
  });
});

describe("fechaDeVentaSinSenal: la hora real de una venta hecha sin internet", () => {
  const ahora = new Date("2026-10-19T18:00:00Z");

  it("acepta la hora en que se vendió", () => {
    expect(fechaDeVentaSinSenal("2026-10-19T14:05:00.000Z", ahora)).toBe("2026-10-19 14:05:00");
  });

  it("rechaza fechas del futuro y de hace más de una semana", () => {
    expect(fechaDeVentaSinSenal("2026-10-20T18:00:00Z", ahora)).toBeNull();
    expect(fechaDeVentaSinSenal("2026-10-01T18:00:00Z", ahora)).toBeNull();
  });

  it("tolera relojes un poco adelantados", () => {
    expect(fechaDeVentaSinSenal("2026-10-19T18:03:00Z", ahora)).toBe("2026-10-19 18:03:00");
  });

  it("basura no es fecha", () => {
    expect(fechaDeVentaSinSenal("ayer", ahora)).toBeNull();
    expect(fechaDeVentaSinSenal(12345, ahora)).toBeNull();
    expect(fechaDeVentaSinSenal(undefined, ahora)).toBeNull();
  });
});

describe("claveDeVentaValida: la llave que evita ventas repetidas", () => {
  it("acepta las que genera el navegador", () => {
    expect(claveDeVentaValida("3f2b8c1e-9a4d-4c55-8e21-1b2c3d4e5f60")).toBe(
      "3f2b8c1e-9a4d-4c55-8e21-1b2c3d4e5f60",
    );
  });

  it("rechaza vacías, cortas o con caracteres raros", () => {
    expect(claveDeVentaValida("")).toBeNull();
    expect(claveDeVentaValida("abc")).toBeNull();
    expect(claveDeVentaValida("x'; DROP TABLE venta;--")).toBeNull();
    expect(claveDeVentaValida(null)).toBeNull();
  });
});
