/**
 * Logo de Proinshop: la diana de círculos concéntricos.
 *
 * Está reconstruido en SVG a partir del logo de la empresa. Cuando el dueño
 * entregue el archivo original en vector, se reemplaza este componente.
 */

export function Diana({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="10" />
      <circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="8.5" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="50" cy="50" r="5.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className = "",
  tamano = "normal",
}: {
  className?: string;
  tamano?: "normal" | "grande" | "pequeno";
}) {
  const medidas = {
    pequeno: { icono: "h-6 w-6", texto: "text-sm" },
    normal: { icono: "h-8 w-8", texto: "text-lg" },
    grande: { icono: "h-10 w-10", texto: "text-2xl" },
  }[tamano];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Diana className={`${medidas.icono} text-rojo`} />
      <span className={`${medidas.texto} font-black tracking-tight`}>PROINSHOP</span>
    </span>
  );
}
