// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const cambiarIdioma = vi.fn<(idioma: string) => Promise<void>>(async () => {});
vi.mock("@/app/acciones", () => ({ cambiarIdioma: (idioma: string) => cambiarIdioma(idioma) }));

const { SelectorIdioma } = await import("@/componentes/SelectorIdioma");

afterEach(() => {
  cleanup();
  cambiarIdioma.mockClear();
});

describe("selector de idioma estilo Amazon", () => {
  it("el botón muestra la bandera de España y el código, nunca otra bandera", () => {
    render(<SelectorIdioma actual="es" />);
    const boton = screen.getByRole("button", { name: "Cambiar idioma" });
    expect(boton.textContent).toContain("🇪🇸");
    expect(boton.textContent).toContain("ES");
    expect(boton.textContent).not.toContain("🇲🇽");
  });

  it("abre la ventanita con «Cambiar idioma» y las dos opciones con su círculo", () => {
    render(<SelectorIdioma actual="es" />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar idioma" }));
    const ventana = screen.getByRole("dialog");
    expect(ventana.textContent).toContain("Cambiar idioma");
    const opciones = screen.getAllByRole("radio");
    expect(opciones).toHaveLength(2);
    expect(screen.getByLabelText(/español - ES/)).toBeTruthy();
    expect(screen.getByLabelText(/English - EN/)).toBeTruthy();
    expect((screen.getByLabelText(/español - ES/) as HTMLInputElement).checked).toBe(true);
  });

  it("elegir inglés cambia el idioma y cierra la ventanita", () => {
    render(<SelectorIdioma actual="es" />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar idioma" }));
    fireEvent.click(screen.getByLabelText(/English - EN/));
    expect(cambiarIdioma).toHaveBeenCalledWith("en");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("se cierra con Escape y al tocar fuera", () => {
    render(<SelectorIdioma actual="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Change language" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Change language" }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
