import { describe, expect, it } from "vitest";
import { leerPermisos, porDefecto, puedeUsar } from "@/lib/permisos";
import { correoValido, esCuentaDeSoporte, revisarContrasena, revisarNombreDeSoporte } from "@/lib/contrasenas";

describe("permisos por módulo", () => {
  it("el propietario puede todo, siempre", () => {
    expect(puedeUsar({ rol: "dueno", permisos: { reportes: false } }, "reportes")).toBe(true);
  });

  it("cada rol trae lo suyo", () => {
    expect(porDefecto("vendedor", "vender")).toBe(true);
    expect(porDefecto("vendedor", "costos")).toBe(false);
    expect(porDefecto("vendedor", "reportes")).toBe(false);
    expect(porDefecto("bodega", "inventario")).toBe(true);
    expect(porDefecto("bodega", "anular")).toBe(false);
  });

  it("lo que prende o apaga el propietario manda sobre el rol", () => {
    expect(puedeUsar({ rol: "vendedor", permisos: { reportes: true } }, "reportes")).toBe(true);
    expect(puedeUsar({ rol: "vendedor", permisos: { vender: false } }, "vender")).toBe(false);
  });

  it("sin sesión no se puede nada", () => {
    expect(puedeUsar(null, "vender")).toBe(false);
  });

  it("permisos guardados rotos no rompen nada: se usa lo del rol", () => {
    expect(leerPermisos("{roto")).toEqual({});
    expect(leerPermisos('{"vender":"si","costos":true,"inventado":true}')).toEqual({ costos: true });
    expect(leerPermisos(null)).toEqual({});
  });
});

describe("cuentas de soporte y contraseñas", () => {
  it("nuestras cuentas tienen que decir Soporte", () => {
    expect(revisarNombreDeSoporte("Carlos", "carlos@windoce.com")).not.toBeNull();
    expect(revisarNombreDeSoporte("Soporte Windoce", "carlos@windoce.com")).toBeNull();
    expect(revisarNombreDeSoporte("Carlos", "carlos@gmail.com")).toBeNull();
  });

  it("reconoce una cuenta de soporte por el correo o por el nombre", () => {
    expect(esCuentaDeSoporte("Ana", "ana@windoce.com")).toBe(true);
    expect(esCuentaDeSoporte("Soporte técnico", "x@gmail.com")).toBe(true);
    expect(esCuentaDeSoporte("Ana", "ana@gmail.com")).toBe(false);
  });

  it("contraseñas: mínimo 8, con letra y número", () => {
    expect(revisarContrasena("corta1")).not.toBeNull();
    expect(revisarContrasena("solamenteletras")).not.toBeNull();
    expect(revisarContrasena("12345678")).not.toBeNull();
    expect(revisarContrasena("buenaclave9")).toBeNull();
  });

  it("correo válido", () => {
    expect(correoValido("correo@ejemplo.com")).toBe(true);
    expect(correoValido("sin-arroba.com")).toBe(false);
    expect(correoValido("a@b.c")).toBe(false);
  });
});
