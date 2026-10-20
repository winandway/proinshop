"use client";

/** Marca o desmarca todas las casillas «ids» del formulario. */
export function SeleccionarTodos() {
  return (
    <label className="flex items-center gap-2 text-[12.5px] font-bold">
      <input
        type="checkbox"
        className="h-4 w-4 accent-rojo"
        onChange={(evento) => {
          const formulario = evento.currentTarget.closest("form");
          formulario
            ?.querySelectorAll<HTMLInputElement>('input[name="ids"]')
            .forEach((casilla) => {
              casilla.checked = evento.currentTarget.checked;
            });
        }}
      />
      Seleccionar todos
    </label>
  );
}
