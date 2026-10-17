import type { Idioma, Texto } from "@/lib/tipos";
import { texto } from "@/lib/i18n";
import { Diana } from "./Logo";

/**
 * Cinta roja con letras que corren solas, debajo del banner.
 *
 * Es un solo renglón repetido dos veces: cuando el primero termina de salir,
 * el segundo está exactamente en su lugar y el movimiento no se corta. Se
 * detiene al pasar el mouse y queda quieta para quien prefiere menos
 * movimiento.
 */
const FRASES: Texto[] = [
  { es: "Importación directa desde China", en: "Direct import from China" },
  { es: "Envíos a todo el país", en: "Nationwide shipping" },
  { es: "Precios al por mayor", en: "Wholesale prices" },
  { es: "Plantas eléctricas", en: "Generators" },
  { es: "Motos y bicicletas", en: "Motorcycles & bikes" },
  { es: "Herramientas", en: "Tools" },
  { es: "Atención por WhatsApp", en: "WhatsApp support" },
];

function Renglon({ idioma, oculto }: { idioma: Idioma; oculto?: boolean }) {
  return (
    <ul aria-hidden={oculto} className="flex shrink-0 items-center">
      {FRASES.map((frase) => (
        <li
          key={frase.es}
          className="flex items-center gap-5 whitespace-nowrap px-5 text-[13px] font-black uppercase tracking-[0.14em] sm:text-sm"
        >
          {texto(frase, idioma)}
          <Diana className="h-4 w-4 text-white/70" />
        </li>
      ))}
    </ul>
  );
}

export function CintaMovimiento({ idioma }: { idioma: Idioma }) {
  return (
    <div className="cinta overflow-hidden bg-rojo py-3.5 text-white">
      <div className="cinta-pista flex w-max">
        <Renglon idioma={idioma} />
        <Renglon idioma={idioma} oculto />
      </div>
    </div>
  );
}
