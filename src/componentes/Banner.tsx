import Link from "next/link";
import type { Idioma } from "@/lib/tipos";
import { texto } from "@/lib/i18n";

/**
 * Banner principal con movimiento. Los tres mensajes se turnan solos.
 * En la Etapa 3 se editan desde "Mi tienda → Banner principal".
 */
const MENSAJES = [
  {
    encabezado: { es: "Importación directa", en: "Direct import" },
    titulo: { es: "Plantas eléctricas desde $640", en: "Generators from $640" },
    detalle: {
      es: "Traemos el equipo directo de fábrica. Sin intermediarios, con garantía de 12 meses y repuestos disponibles.",
      en: "We bring equipment straight from the factory. No middlemen, 12-month warranty and spare parts on hand.",
    },
    boton: { es: "Ver catálogo", en: "Shop now" },
    enlace: "/categoria/plantas-electricas",
    emoji: "⚡",
    fondo: "bg-linear-115 from-[#ff3b3b] to-[#a50d0d]",
  },
  {
    encabezado: { es: "Nuevo en tienda", en: "New arrivals" },
    titulo: { es: "Motos y bicicletas eléctricas", en: "Motorcycles & e-bikes" },
    detalle: {
      es: "Modelos 150cc doble propósito y bicicletas de 500W listas para entrega inmediata.",
      en: "150cc dual-sport models and 500W bicycles ready for immediate delivery.",
    },
    boton: { es: "Ver modelos", en: "See models" },
    enlace: "/categoria/motos",
    emoji: "🏍️",
    fondo: "bg-linear-115 from-[#14161a] to-[#3c414b]",
  },
  {
    encabezado: { es: "Al por mayor", en: "Wholesale" },
    titulo: { es: "Precios especiales por volumen", en: "Special volume pricing" },
    detalle: {
      es: "Cotiza por cantidad y recibe tu propuesta en menos de 24 horas por WhatsApp.",
      en: "Request a volume quote and get your proposal within 24 hours on WhatsApp.",
    },
    boton: { es: "Cotizar ahora", en: "Get a quote" },
    enlace: "/catalogo",
    emoji: "🚢",
    fondo: "bg-linear-115 from-[#d91414] to-[#4a0606]",
  },
];

export function Banner({ idioma }: { idioma: Idioma }) {
  return (
    <section
      aria-label={idioma === "es" ? "Destacados" : "Highlights"}
      className="relative h-[230px] overflow-hidden rounded-3xl sm:h-[300px] lg:h-[380px] lg:rounded-none"
    >
      {MENSAJES.map((mensaje, indice) => (
        <div
          key={mensaje.enlace + indice}
          className={`banner-slide absolute inset-0 flex items-center px-6 opacity-0 sm:px-12 lg:px-16 ${mensaje.fondo}`}
          style={{ animationDelay: `${indice * 6}s` }}
        >
          <span className="absolute -right-16 -top-32 h-72 w-72 rounded-full bg-white/10 lg:h-[420px] lg:w-[420px]" />

          <div className="relative z-10 max-w-[62%] text-white lg:max-w-lg">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-85 sm:text-xs">
              {texto(mensaje.encabezado, idioma)}
            </p>
            <h2 className="mt-2 text-2xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:mt-3 lg:text-5xl">
              {texto(mensaje.titulo, idioma)}
            </h2>
            <p className="mt-3 hidden max-w-md text-sm leading-relaxed opacity-90 sm:block">
              {texto(mensaje.detalle, idioma)}
            </p>
            <Link
              href={mensaje.enlace}
              className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-tinta transition hover:bg-crema sm:px-7 sm:py-3.5 sm:text-sm lg:mt-6"
            >
              {texto(mensaje.boton, idioma)} →
            </Link>
          </div>

          <span
            aria-hidden="true"
            className="flota absolute -bottom-2 right-0 text-[88px] sm:right-6 sm:text-[150px] lg:right-20 lg:text-[220px]"
          >
            {mensaje.emoji}
          </span>
        </div>
      ))}
    </section>
  );
}
