"use client";

/**
 * Imprime la página tal cual o la guarda en PDF: el diálogo de impresión del
 * celular y de la computadora trae «Guardar como PDF». Lo que no es parte del
 * documento (menús, botones) lleva la clase print:hidden y no sale.
 */
export function BotonImprimir({ texto = "Imprimir o guardar PDF" }: { texto?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="block w-full rounded-2xl border-[1.5px] border-linea bg-white py-3.5 text-sm font-extrabold transition hover:border-gris2 print:hidden"
    >
      🖨 {texto}
    </button>
  );
}
