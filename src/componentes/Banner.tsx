import Link from "next/link";
import type { Idioma, Texto } from "@/lib/tipos";
import { texto } from "@/lib/i18n";
import { enlaceWhatsapp } from "@/lib/config";
import { Diana } from "./Logo";

/**
 * Banner principal: cuatro mensajes que se turnan solos.
 *
 * La foto es solo foto: sin letras ni logo dentro. El logo, los textos y los
 * botones los pone la página encima, porque así salen nítidos en cualquier
 * pantalla, se traducen al inglés y se corrigen sin volver a diseñar nada.
 * Una foto con el texto pegado sale cortada en el celular y no se traduce.
 *
 * Cada foto vive en public/banners/<nombre>.webp (computadora: la foto con el
 * fondo oscuro alargado a la izquierda, 4600 × 1024, para que en una pantalla
 * ancha el producto se vea entero) y <nombre>-movil.webp (celular: recorte de
 * 900 px con el producto). docs/BANNERS.md explica cómo se preparan.
 * Mientras un mensaje no tenga foto, se ve con su fondo de color y su ícono.
 */
type Mensaje = {
  encabezado: Texto;
  titulo: Texto;
  detalle: Texto;
  boton: Texto;
  enlace: string;
  emoji: string;
  fondo: string;
  /** Nombre de la foto en public/banners, sin tamaño ni extensión. */
  imagen?: string;
};

const MENSAJES: Mensaje[] = [
  {
    encabezado: { es: "Plantas eléctricas", en: "Generators" },
    titulo: { es: "Energía que no se corta", en: "Power that never quits" },
    detalle: {
      es: "Equipos importados directo de fábrica para tu casa, tu negocio o tu obra.",
      en: "Factory-direct equipment for your home, your business or your job site.",
    },
    boton: { es: "Ver plantas", en: "Shop generators" },
    enlace: "/categoria/plantas-electricas",
    imagen: "plantas",
    emoji: "⚡",
    fondo: "bg-linear-115 from-[#ff3b3b] to-[#a50d0d]",
  },
  {
    encabezado: { es: "Nuevo en tienda", en: "New arrivals" },
    titulo: { es: "Motos y bicicletas eléctricas", en: "Motorcycles & e-bikes" },
    detalle: {
      es: "Modelos de gasolina y eléctricos, listos para entregar.",
      en: "Gas and electric models, ready for delivery.",
    },
    boton: { es: "Ver modelos", en: "See models" },
    enlace: "/categoria/motos",
    imagen: "motos",
    emoji: "🏍️",
    fondo: "bg-linear-115 from-[#14161a] to-[#3c414b]",
  },
  {
    encabezado: { es: "Herramientas", en: "Tools" },
    titulo: { es: "Hechas para trabajar duro", en: "Built for hard work" },
    detalle: {
      es: "Soldadoras, compresores y kits profesionales para el taller y la obra.",
      en: "Welders, compressors and pro kits for the shop and the job site.",
    },
    boton: { es: "Ver herramientas", en: "Shop tools" },
    enlace: "/categoria/herramientas",
    imagen: "herramientas",
    emoji: "🔧",
    fondo: "bg-linear-115 from-[#2a2d33] to-[#14161a]",
  },
  {
    encabezado: { es: "Importación directa", en: "Direct import" },
    titulo: { es: "Precios al por mayor", en: "Wholesale pricing" },
    detalle: {
      es: "Compra por volumen directo de China. Pide tu cotización por WhatsApp.",
      en: "Buy in volume straight from China. Ask for your quote on WhatsApp.",
    },
    boton: { es: "Ver catálogo", en: "Browse catalog" },
    enlace: "/catalogo",
    imagen: "mayor",
    emoji: "🚢",
    fondo: "bg-linear-115 from-[#d91414] to-[#4a0606]",
  },
];

export function Banner({ idioma, whatsapp }: { idioma: Idioma; whatsapp?: string }) {
  return (
    <section
      aria-label={idioma === "es" ? "Destacados" : "Highlights"}
      className="relative h-[380px] overflow-hidden rounded-3xl bg-tinta sm:h-[340px] lg:h-[440px] lg:rounded-none"
    >
      {MENSAJES.map((mensaje, indice) => (
        <div
          key={mensaje.enlace + indice}
          className={`banner-slide invisible absolute inset-0 opacity-0 ${mensaje.imagen ? "" : mensaje.fondo}`}
          style={{ animationDelay: `${indice * 6}s` }}
        >
          {mensaje.imagen ? (
            <>
              {/* En el celular va un recorte con el producto grande; en pantallas
                  grandes, la foto alargada, pegada a la derecha. */}
              <picture>
                <source media="(max-width: 639px)" srcSet={`/banners/${mensaje.imagen}-movil.webp`} />
                <img
                  src={`/banners/${mensaje.imagen}.webp`}
                  alt=""
                  width={4600}
                  height={1024}
                  loading={indice === 0 ? "eager" : "lazy"}
                  fetchPriority={indice === 0 ? "high" : "auto"}
                  className="absolute inset-0 h-full w-full object-cover object-top sm:object-right"
                />
              </picture>
              {/* Velo para que el texto se lea sobre cualquier foto: desde abajo en
                  el celular, desde la izquierda en la computadora. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-t from-[#0e0f12] via-[#0e0f12]/70 via-45% to-transparent to-75% sm:bg-linear-to-r sm:from-[#0e0f12]/90 sm:via-[#0e0f12]/55 sm:to-transparent"
              />
            </>
          ) : (
            <>
              <span className="absolute -right-16 -top-32 h-72 w-72 rounded-full bg-white/10 lg:h-[420px] lg:w-[420px]" />
              <span
                aria-hidden="true"
                className="flota absolute -bottom-2 right-0 text-[88px] sm:right-6 sm:text-[150px] lg:right-20 lg:text-[220px]"
              >
                {mensaje.emoji}
              </span>
            </>
          )}

          <div
            className={`relative z-10 flex h-full flex-col px-6 pb-12 text-white sm:justify-center sm:px-12 sm:pb-0 lg:px-16 ${
              mensaje.imagen ? "justify-end" : "justify-center"
            }`}
          >
            <div className={mensaje.imagen ? "max-w-xl" : "max-w-full sm:max-w-[62%] lg:max-w-lg"}>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] opacity-90 sm:text-xs">
                {/* Sobre la foto oscura, la diana roja; sobre los fondos rojos, blanca. */}
                <Diana
                  className={`h-4 w-4 sm:h-[18px] sm:w-[18px] ${mensaje.imagen ? "text-rojo" : "text-white"}`}
                />
                {texto(mensaje.encabezado, idioma)}
              </p>
              <h2 className="mt-2 text-[26px] font-black leading-[1.05] tracking-tight sm:text-4xl lg:mt-3 lg:text-[56px]">
                {texto(mensaje.titulo, idioma)}
              </h2>
              {/* En el celular la descripción se queda fuera: la foto tiene que verse. */}
              <p className="mt-3 hidden max-w-md text-sm leading-relaxed opacity-90 sm:block lg:text-base">
                {texto(mensaje.detalle, idioma)}
              </p>
              <div className="mt-4 flex items-center gap-2 sm:gap-2.5 lg:mt-7">
                <Link
                  href={mensaje.enlace}
                  className="whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-tinta transition hover:bg-crema sm:px-7 sm:py-3.5 sm:text-sm"
                >
                  {texto(mensaje.boton, idioma)} →
                </Link>
                {whatsapp && (
                  <a
                    href={enlaceWhatsapp(
                      idioma === "es"
                        ? "Hola, quiero una cotización."
                        : "Hi, I'd like a quote.",
                      whatsapp,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap rounded-full border border-white/50 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-white/10 sm:px-7 sm:py-3.5 sm:text-sm"
                  >
                    <span className="sm:hidden">WhatsApp</span>
                    <span className="hidden sm:inline">
                      {idioma === "es" ? "Cotiza por WhatsApp" : "Quote on WhatsApp"}
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Cuál de los cuatro se está viendo: cada mensaje marca el suyo. */}
          <div
            aria-hidden="true"
            className="absolute bottom-4 left-6 z-10 flex gap-1.5 sm:left-12 lg:bottom-6 lg:left-16"
          >
            {MENSAJES.map((_, punto) => (
              <span
                key={punto}
                className={`h-1 rounded-full transition-all ${
                  punto === indice ? "w-7 bg-white" : "w-3 bg-white/35"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
