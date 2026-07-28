/**
 * Foto del producto.
 *
 * Mientras el dueño no haya tomado la foto desde la app, se muestra el ícono
 * de la categoría sobre un fondo claro — nunca un cuadro roto ni un vacío.
 * Cuando la foto exista en R2, entra por `fotos[0]` y reemplaza el ícono.
 */

export function FotoProducto({
  emoji,
  fotos,
  alt,
  tamano = "normal",
  className = "",
}: {
  emoji: string;
  fotos: string[];
  alt: string;
  tamano?: "pequeno" | "normal" | "grande";
  className?: string;
}) {
  const medidas = {
    pequeno: "text-3xl",
    normal: "text-5xl",
    grande: "text-8xl",
  }[tamano];

  if (fotos.length > 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- las fotos vienen de R2 por CDN, ya optimizadas al subirlas.
      <img
        src={`/media/${fotos[0]}`}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-contain ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`grid h-full w-full place-items-center bg-linear-to-br from-[#f7f8fa] to-[#e9ecf1] ${medidas} ${className}`}
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
