"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Idioma, Texto } from "@/lib/tipos";
import { texto } from "@/lib/i18n";
import { enlaceWhatsapp } from "@/lib/config";
import { Diana } from "./Logo";

/**
 * Vitrina de novedades: una sola foto grande a la vez, que pasa sola.
 *
 * Las fotos vienen recortadas, con fondo transparente (public/vitrina), así
 * que van sobre el gris claro de la tienda con un círculo rojo detrás que
 * recuerda la diana del logo. Se detiene cuando la persona pasa el mouse o
 * toca los puntos, y no corre sola para quien prefiere menos movimiento.
 *
 * Los textos describen solo lo que se ve en la foto: nada de precios ni
 * datos técnicos que el dueño todavía no dio.
 */
type Novedad = { imagen: string; nombre: Texto; detalle: Texto };

const NOVEDADES: Novedad[] = [
  {
    imagen: "estacion-energia",
    nombre: { es: "Estación de energía portátil", en: "Portable power station" },
    detalle: {
      es: "Carga tu celular, tu computadora y tus equipos donde no hay luz.",
      en: "Charge your phone, laptop and devices wherever there's no power.",
    },
  },
  {
    imagen: "bicicleta-equilibrio",
    nombre: { es: "Bicicleta de equilibrio", en: "Balance bike" },
    detalle: {
      es: "Para que los más pequeños aprendan a andar en bici, sin rueditas.",
      en: "Helps little ones learn to ride, no training wheels needed.",
    },
  },
  {
    imagen: "coche-paseo",
    nombre: { es: "Coche de paseo compacto", en: "Compact stroller" },
    detalle: {
      es: "Liviano, con techo y cinturón de cinco puntos.",
      en: "Lightweight, with a canopy and a five-point harness.",
    },
  },
];

const SEGUNDOS = 5;

export function VitrinaNovedades({ idioma, whatsapp }: { idioma: Idioma; whatsapp?: string }) {
  const [actual, setActual] = useState(0);
  const [detenida, setDetenida] = useState(false);

  useEffect(() => {
    if (detenida) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reloj = window.setInterval(
      () => setActual((indice) => (indice + 1) % NOVEDADES.length),
      SEGUNDOS * 1000,
    );
    return () => window.clearInterval(reloj);
  }, [detenida]);

  const novedad = NOVEDADES[actual] ?? NOVEDADES[0]!;
  const nombre = texto(novedad.nombre, idioma);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label={idioma === "es" ? "Novedades" : "New in"}
      className="mx-auto max-w-7xl px-4 pb-12 sm:px-6"
      onMouseEnter={() => setDetenida(true)}
      onMouseLeave={() => setDetenida(false)}
      onFocus={() => setDetenida(true)}
    >
      <div className="grid overflow-hidden rounded-3xl bg-crema lg:grid-cols-2">
        <div className="relative order-first h-[300px] sm:h-[380px] lg:order-last lg:h-[480px]">
          {/* El círculo rojo de fondo recuerda la diana del logo. */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[78%] w-auto -translate-x-1/2 -translate-y-1/2 rounded-full bg-rojo/10 ring-[18px] ring-rojo/5"
            style={{ aspectRatio: "1" }}
          />
          {NOVEDADES.map((item, indice) => (
            // eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas en public/vitrina
            <img
              key={item.imagen}
              src={`/vitrina/${item.imagen}.webp`}
              alt={indice === actual ? texto(item.nombre, idioma) : ""}
              aria-hidden={indice !== actual}
              width={1000}
              height={1000}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-contain p-6 drop-shadow-[0_18px_22px_rgba(16,20,30,0.18)] transition-all duration-700 sm:p-10 ${
                indice === actual ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-14">
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-rojo sm:text-xs">
            <Diana className="h-4 w-4" />
            {idioma === "es" ? "Nuevo en Proinshop" : "New at Proinshop"}
          </p>

          {/* La clave hace que el texto entre de nuevo con cada producto. */}
          <div key={actual} className="aparece" aria-live="polite">
            <h2 className="mt-3 text-[28px] font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              {nombre}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gris sm:text-base">
              {texto(novedad.detalle, idioma)}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {whatsapp ? (
              <a
                href={enlaceWhatsapp(
                  idioma === "es"
                    ? `Hola, quiero información de: ${nombre}`
                    : `Hi, I'd like information about: ${nombre}`,
                  whatsapp,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap rounded-full bg-rojo px-6 py-3 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
              >
                {idioma === "es" ? "Pregunta por WhatsApp" : "Ask on WhatsApp"}
              </a>
            ) : null}
            <Link
              href="/catalogo"
              className={`whitespace-nowrap rounded-full px-6 py-3 text-sm font-extrabold transition ${
                whatsapp
                  ? "border-[1.5px] border-linea bg-white text-tinta hover:border-gris2"
                  : "bg-rojo text-white hover:bg-rojo-oscuro"
              }`}
            >
              {idioma === "es" ? "Ver catálogo" : "Browse catalog"} →
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-2">
            {NOVEDADES.map((item, indice) => (
              <button
                key={item.imagen}
                type="button"
                onClick={() => {
                  setActual(indice);
                  setDetenida(true);
                }}
                aria-label={texto(item.nombre, idioma)}
                aria-current={indice === actual}
                className={`h-1.5 rounded-full transition-all ${
                  indice === actual ? "w-8 bg-rojo" : "w-3 bg-gris2/50 hover:bg-gris2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
