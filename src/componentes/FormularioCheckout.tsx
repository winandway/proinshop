"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resolverLineas } from "./VistaCarrito";
import { useCarrito } from "./carrito";
import { formatearPrecio, texto, textos } from "@/lib/i18n";
import type { Idioma, MetodoEntrega, MetodoPago, Producto } from "@/lib/tipos";
import { guardarPedido } from "@/app/(tienda)/checkout/acciones";

export function FormularioCheckout({
  productos,
  idioma,
  costoEnvioTienda,
}: {
  productos: Producto[];
  idioma: Idioma;
  costoEnvioTienda: number;
}) {
  const t = textos(idioma);
  const router = useRouter();
  const { lineas, listo, vaciar } = useCarrito();

  const [entrega, setEntrega] = useState<MetodoEntrega>("domicilio");
  const [pago, setPago] = useState<MetodoPago>("transferencia");
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  if (!listo) {
    return <div className="py-24 text-center text-sm text-gris">…</div>;
  }

  const resueltas = resolverLineas(lineas, productos, idioma);
  const subtotal = resueltas.reduce((suma, l) => suma + l.subtotal, 0);
  const costoEnvio = entrega === "domicilio" ? costoEnvioTienda : 0;
  const total = subtotal + costoEnvio;

  if (resueltas.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-extrabold">{t.carritoVacio}</p>
        <Link
          href="/catalogo"
          className="mt-6 inline-block rounded-2xl bg-rojo px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
        >
          {t.seguirComprando}
        </Link>
      </div>
    );
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setFallo(null);

    const datos = new FormData(evento.currentTarget);

    // El pedido se guarda en la base del negocio. Si eso falla, el cliente se
    // entera: antes el pedido se perdía en silencio.
    const guardado = await guardarPedido({
      cliente: {
        nombre: String(datos.get("nombre") ?? ""),
        celular: String(datos.get("celular") ?? ""),
        correo: String(datos.get("correo") ?? ""),
        direccion: String(datos.get("direccion") ?? ""),
      },
      entrega,
      pago,
      envio: costoEnvioTienda,
      lineas: lineas.map((l) => ({
        productoSlug: l.productoSlug,
        varianteId: l.varianteId,
        cantidad: l.cantidad,
      })),
    });

    if (guardado.error || !guardado.numero) {
      setEnviando(false);
      setFallo(guardado.error ?? "No se pudo enviar el pedido. Inténtalo de nuevo.");
      return;
    }

    const numero = guardado.numero;

    vaciar();
    router.push(`/pedido/${numero}`);
  }

  const campo =
    "w-full rounded-xl border-[1.5px] border-linea px-4 py-3.5 text-sm font-medium outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

  return (
    <form onSubmit={enviar} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        {fallo && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rojo bg-rojo-suave px-4 py-3 text-[13px] font-bold text-rojo-oscuro"
          >
            {fallo}
          </p>
        )}
        <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-gris">
          1. {t.tusDatos}
        </h2>
        <div className="mt-3 space-y-3">
          <input name="nombre" required placeholder={t.nombreCompleto} className={campo} />
          <input
            name="celular"
            type="tel"
            required
            placeholder={t.celular}
            className={campo}
          />
          <input name="correo" type="email" placeholder={t.correo} className={campo} />
        </div>

        <h2 className="mt-8 text-[13px] font-extrabold uppercase tracking-wide text-gris">
          2. {t.entrega}
        </h2>
        <div className="mt-3 space-y-2.5">
          <button
            type="button"
            onClick={() => setEntrega("domicilio")}
            aria-pressed={entrega === "domicilio"}
            className={`flex w-full items-center gap-3 rounded-2xl border-[1.5px] p-4 text-left transition ${
              entrega === "domicilio" ? "border-rojo bg-rojo-suave" : "border-linea hover:border-gris2"
            }`}
          >
            <span aria-hidden="true" className="text-xl">
              🚚
            </span>
            <span className="flex-1">
              <span className="block text-[13px] font-extrabold">{t.envioDomicilio}</span>
              <span className="block text-[11.5px] text-gris">{t.envioDomicilioTexto}</span>
            </span>
            <span className="text-sm font-black">{formatearPrecio(costoEnvioTienda)}</span>
          </button>

          <button
            type="button"
            onClick={() => setEntrega("local")}
            aria-pressed={entrega === "local"}
            className={`flex w-full items-center gap-3 rounded-2xl border-[1.5px] p-4 text-left transition ${
              entrega === "local" ? "border-rojo bg-rojo-suave" : "border-linea hover:border-gris2"
            }`}
          >
            <span aria-hidden="true" className="text-xl">
              🏪
            </span>
            <span className="flex-1">
              <span className="block text-[13px] font-extrabold">{t.recogerLocal}</span>
              <span className="block text-[11.5px] text-gris">{t.recogerLocalTexto}</span>
            </span>
            <span className="text-sm font-black text-verde">{t.gratis}</span>
          </button>
        </div>

        {entrega === "domicilio" && (
          <input
            name="direccion"
            required
            placeholder={t.direccion}
            className={`${campo} mt-3`}
          />
        )}

        <h2 className="mt-8 text-[13px] font-extrabold uppercase tracking-wide text-gris">
          3. {t.pago}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["transferencia", `🏦 ${t.transferencia}`],
              ["tarjeta", `💳 ${t.tarjeta}`],
              ["contraentrega", `💵 ${t.contraentrega}`],
            ] as [MetodoPago, string][]
          ).map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setPago(clave)}
              aria-pressed={pago === clave}
              className={`rounded-full border px-4 py-2.5 text-xs font-bold transition ${
                pago === clave
                  ? "border-tinta bg-tinta text-white"
                  : "border-linea bg-white text-gris hover:border-gris2"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-linea p-5 lg:sticky lg:top-32">
        <ul className="space-y-3 border-b border-linea pb-4">
          {resueltas.map((linea) => (
            <li
              key={`${linea.producto.slug}-${linea.varianteId ?? "base"}`}
              className="flex items-center gap-3 text-[13px]"
            >
              <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-lg bg-crema text-lg">
                {linea.producto.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 font-bold">{texto(linea.producto.nombre, idioma)}</span>
                <span className="block text-[11.5px] text-gris">
                  {linea.cantidad} × {formatearPrecio(linea.precioUnitario)}
                </span>
              </span>
              <span className="font-black">{formatearPrecio(linea.subtotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-gris">
            <dt>{t.subtotal}</dt>
            <dd className="font-bold text-tinta">{formatearPrecio(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-gris">
            <dt>{t.envio}</dt>
            <dd className="font-bold text-tinta">
              {costoEnvio === 0 ? t.gratis : formatearPrecio(costoEnvio)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-linea pt-3">
            <dt className="font-black">{t.total}</dt>
            <dd className="text-xl font-black tracking-tight">{formatearPrecio(total)}</dd>
          </div>
        </dl>

        <button
          type="submit"
          disabled={enviando}
          className="mt-5 w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-60"
        >
          {t.confirmarPedido} · {formatearPrecio(total)}
        </button>
      </aside>
    </form>
  );
}
