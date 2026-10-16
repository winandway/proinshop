import Link from "next/link";
import { obtenerCategoriasConProductos } from "@/lib/catalogo";
import { texto, textos } from "@/lib/i18n";
import { idiomaActual } from "@/lib/idioma-servidor";
import { NEGOCIO, enlaceWhatsapp } from "@/lib/config";
import { obtenerConfigTienda } from "@/lib/config-tienda";
import { Diana } from "./Logo";

export async function PieDePagina() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const [categorias, config] = await Promise.all([obtenerCategoriasConProductos(), obtenerConfigTienda()]);
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-[#0e0f12] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 border-b border-[#23262c] pb-9 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <span className="inline-flex items-center gap-2.5">
              <Diana className="h-8 w-8 text-rojo" />
              <span className="text-lg font-black tracking-tight">PROINSHOP</span>
            </span>
            <p className="mt-4 text-[13px] leading-relaxed text-[#8c929c]">{t.descripcionTienda}</p>
          </div>

          <div>
            <h2 className="mb-3 text-[13px] font-extrabold">{t.catalogo}</h2>
            <ul className="space-y-2 text-[13px] text-[#8c929c]">
              {categorias.map((categoria) => (
                <li key={categoria.slug}>
                  <Link href={`/categoria/${categoria.slug}`} className="transition hover:text-white">
                    {texto(categoria.nombre, idioma)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-[13px] font-extrabold">{t.ayuda}</h2>
            <ul className="space-y-2 text-[13px] text-[#8c929c]">
              <li>{t.envios}</li>
              <li>{t.garantia}</li>
              <li>{t.preguntas}</li>
              <li>{t.nosotros}</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-[13px] font-extrabold">{t.contacto}</h2>
            <ul className="space-y-2 text-[13px] text-[#8c929c]">
              {config.whatsapp && (
                <li>
                  <a
                    href={enlaceWhatsapp(
                      idioma === "es" ? "Hola, quiero información." : "Hi, I'd like some info.",
                      config.whatsapp,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    💬 WhatsApp
                  </a>
                </li>
              )}
              {config.correo && (
                <li>
                  <a href={`mailto:${config.correo}`} className="transition hover:text-white">
                    ✉️ {config.correo}
                  </a>
                </li>
              )}
              {config.direccion && <li>📍 {config.direccion}</li>}
            </ul>
          </div>
        </div>

        <p className="pt-6 text-center text-xs text-[#7b818c]">
          © {anio} {NEGOCIO.dominio} | All rights reserved. Developed by{" "}
          <a
            href="https://windoce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-rojo transition hover:text-white"
          >
            Windoce LLC
          </a>
        </p>
      </div>
    </footer>
  );
}
