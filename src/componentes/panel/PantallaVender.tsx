"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { enviarSinBorrar } from "@/componentes/enviar-sin-borrar";
import {
  borrarBorradorDe,
  guardarBorradorDe,
  leerBorradorDe,
  useDuenoBorrador,
} from "@/componentes/GuardaBorrador";
import { EscanerCodigo } from "@/componentes/panel/EscanerCodigo";
import { agregarACola, nuevaClave } from "@/componentes/panel/cola-ventas";
import { repartirPagos } from "@/lib/ventas";
import { leerMonto } from "@/lib/numeros";
import { registrarVenta, type ResultadoVenta } from "@/app/panel/(dentro)/vender/acciones";
import { formatearPrecio } from "@/lib/i18n";
import { enMoneda2 } from "@/lib/moneda";
import type { ClienteSimple, ProductoVenta } from "@/lib/negocio";
import { METODOS_PAGO, type MetodoPago } from "@/lib/metodos";

/**
 * Registrar una venta, igual que en Treinta: buscar por nombre o código,
 * escanear con la cámara o con un lector, elegir color o talla, cobrar con
 * uno o varios métodos (pago mixto), dejar parte fiada y anotar una nota.
 *
 * Lo que va en el carrito se guarda solo: si se cierra la ventana a mitad de
 * una venta, al volver está igual.
 *
 * Sin señal también se vende: la venta se guarda en el dispositivo y se manda
 * sola cuando vuelve el internet (ver cola-ventas).
 */

type Linea = { productoId: number; varianteId: number | null; cantidad: number };
type EstadoVenta = ResultadoVenta & { guardadaSinSenal?: boolean };
type Parte = { metodo: MetodoPago; monto: string };

type Borrador = {
  lineas: Linea[];
  mixto: boolean;
  metodo: MetodoPago;
  partes: Parte[];
  clienteId: string;
  descuento: string;
  nota: string;
};

/**
 * Guarda la venta en el dispositivo para mandarla cuando vuelva la señal.
 * Antes revisa lo que se puede revisar sin internet (que el pago cuadre y que
 * el fiado tenga cliente), para no guardar algo que el servidor va a rechazar.
 */
function guardarSinSenal(datos: FormData, dueno: string): EstadoVenta {
  const total = Math.round(leerMonto(datos.get("total")) * 100) / 100;
  let pagos: unknown;
  let lineas: Linea[];
  try {
    pagos = JSON.parse(String(datos.get("pagos") ?? "[]"));
    lineas = JSON.parse(String(datos.get("lineas") ?? "[]"));
  } catch {
    return { error: "No se pudo leer la venta" };
  }
  if (!Array.isArray(lineas) || lineas.length === 0) return { error: "Agrega al menos un producto" };
  const cobro = repartirPagos(pagos, total);
  if ("error" in cobro) return { error: cobro.error };
  if (cobro.fiado > 0 && !datos.get("cliente_id")) {
    return { error: "Para dejar algo fiado tienes que elegir el cliente" };
  }
  try {
    agregarACola(dueno, {
      clave: String(datos.get("clave")),
      fecha: new Date().toISOString(),
      lineas: String(datos.get("lineas")),
      pagos: String(datos.get("pagos")),
      cliente_id: String(datos.get("cliente_id") ?? ""),
      descuento: String(datos.get("descuento") ?? ""),
      nota: String(datos.get("nota") ?? ""),
      total,
      unidades: lineas.reduce((suma, linea) => suma + (Number(linea.cantidad) || 0), 0),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar la venta" };
  }
  return { guardadaSinSenal: true };
}

const clave = (linea: { productoId: number; varianteId: number | null }) =>
  `${linea.productoId}:${linea.varianteId ?? ""}`;

export function PantallaVender({
  productos,
  clientes,
  moneda2,
  tasa2,
}: {
  productos: ProductoVenta[];
  clientes: ClienteSimple[];
  moneda2: string;
  tasa2: number;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [mixto, setMixto] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [partes, setPartes] = useState<Parte[]>([
    { metodo: "efectivo", monto: "" },
    { metodo: "transferencia", monto: "" },
  ]);
  const [clienteId, setClienteId] = useState("");
  const [descuento, setDescuento] = useState("");
  const [nota, setNota] = useState("");
  const [eligiendo, setEligiendo] = useState<number | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [recuperada, setRecuperada] = useState(false);
  const dueno = useDuenoBorrador();
  const primeraVez = useRef(true);
  // La llave de esta venta: si la respuesta se pierde en el camino y se
  // reintenta, el servidor reconoce que es la misma y no la cobra dos veces.
  const claveVenta = useRef<string | null>(null);

  const [estado, enviar, enviando] = useActionState<EstadoVenta, FormData>(async (previo, datos) => {
    claveVenta.current ??= nuevaClave();
    datos.set("clave", claveVenta.current);

    const sinSenal = (): EstadoVenta => {
      const resultado = guardarSinSenal(datos, dueno);
      if (resultado.guardadaSinSenal) {
        claveVenta.current = null;
        borrarBorradorDe("venta", dueno);
        setLineas([]);
        setMixto(false);
        setMetodo("efectivo");
        setClienteId("");
        setDescuento("");
        setNota("");
        setRecuperada(false);
      }
      return resultado;
    };

    if (!navigator.onLine) return sinSenal();
    try {
      const resultado = await registrarVenta(previo, datos);
      // Respondió con un problema (sin stock, falta el cliente…): no se
      // guardó nada, así que el próximo intento es una venta nueva.
      claveVenta.current = null;
      return resultado;
    } catch (error) {
      // Se cayó la señal a mitad del envío. Puede que el servidor la haya
      // alcanzado a guardar: va a la cola con la misma llave y, si ya
      // existe, el servidor no la repite.
      if (error instanceof TypeError) return sinSenal();
      throw error;
    }
  }, {});

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  // Si se cerró la ventana o se fue el internet a mitad de una venta, al
  // volver está el carrito tal como quedó.
  useEffect(() => {
    const espera = window.setTimeout(() => {
      const guardada = leerBorradorDe<Borrador>("venta", dueno);
      if (!guardada || !Array.isArray(guardada.lineas)) return;
      const validas = guardada.lineas.filter(
        (linea) => linea.cantidad > 0 && porId.has(linea.productoId),
      );
      if (validas.length === 0 && !guardada.descuento && !guardada.clienteId) return;
      setLineas(validas);
      setMixto(Boolean(guardada.mixto));
      setMetodo(guardada.metodo ?? "efectivo");
      if (Array.isArray(guardada.partes) && guardada.partes.length > 0) setPartes(guardada.partes);
      setClienteId(guardada.clienteId ?? "");
      setDescuento(guardada.descuento ?? "");
      setNota(guardada.nota ?? "");
      setRecuperada(true);
    }, 0);
    return () => window.clearTimeout(espera);
  }, [dueno, porId]);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    const espera = window.setTimeout(() => {
      const vacia = lineas.length === 0 && !descuento && !clienteId && !nota;
      if (vacia) borrarBorradorDe("venta", dueno);
      else
        guardarBorradorDe("venta", dueno, {
          lineas,
          mixto,
          metodo,
          partes,
          clienteId,
          descuento,
          nota,
        } satisfies Borrador);
    }, 500);
    return () => window.clearTimeout(espera);
  }, [lineas, mixto, metodo, partes, clienteId, descuento, nota, dueno]);

  function empezarDeNuevo() {
    borrarBorradorDe("venta", dueno);
    setLineas([]);
    setMixto(false);
    setMetodo("efectivo");
    setClienteId("");
    setDescuento("");
    setNota("");
    setRecuperada(false);
  }

  /** Lo que queda disponible de ese producto o de esa variante. */
  function tope(producto: ProductoVenta, varianteId: number | null): number {
    if (producto.es_servicio) return 9999;
    if (varianteId) return producto.variantes.find((v) => v.id === varianteId)?.stock ?? 0;
    return producto.stock;
  }

  function sumar(productoId: number, varianteId: number | null, delta: number) {
    const producto = porId.get(productoId);
    if (!producto) return;
    const maximo = tope(producto, varianteId);
    const k = clave({ productoId, varianteId });
    const existente = lineas.find((l) => clave(l) === k);
    if (delta > 0 && (existente?.cantidad ?? 0) >= maximo) {
      setAviso(`No hay más unidades de «${producto.nombre_es}».`);
      return;
    }
    const cantidad = Math.min(maximo, Math.max(0, (existente?.cantidad ?? 0) + delta));
    const resto = lineas.filter((l) => clave(l) !== k);
    setLineas(cantidad > 0 ? [...resto, { productoId, varianteId, cantidad }] : resto);
  }

  /** Tocar un producto: si tiene colores o tallas, primero se elige cuál. */
  function elegir(producto: ProductoVenta) {
    setAviso(null);
    if (producto.variantes.length > 0) {
      setEligiendo(eligiendo === producto.id ? null : producto.id);
      return;
    }
    sumar(producto.id, null, 1);
  }

  /** Un código del escáner, del lector o escrito con Enter. */
  function porCodigo(codigo: string): boolean {
    const limpio = codigo.trim().toLowerCase();
    if (!limpio) return false;
    const producto = productos.find(
      (p) =>
        p.codigo_barras?.trim().toLowerCase() === limpio || p.sku?.trim().toLowerCase() === limpio,
    );
    if (!producto) {
      setAviso(`No hay ningún producto con el código ${codigo.trim()}.`);
      return false;
    }
    elegir(producto);
    if (producto.variantes.length > 0) {
      setBusqueda(producto.nombre_es);
      setAviso(`«${producto.nombre_es}»: elige el color o la talla.`);
    } else {
      setAviso(`Agregado: ${producto.nombre_es}.`);
    }
    return true;
  }

  const encontrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos.slice(0, 10);
    return productos
      .filter(
        (p) =>
          p.nombre_es.toLowerCase().includes(q) ||
          p.codigo_barras?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [busqueda, productos]);

  const detalle = lineas
    .map((linea) => {
      const producto = porId.get(linea.productoId);
      if (!producto) return null;
      const variante = producto.variantes.find((v) => v.id === linea.varianteId) ?? null;
      const precio = producto.precio + (variante?.precioExtra ?? 0);
      return { linea, producto, variante, precio, importe: precio * linea.cantidad };
    })
    .filter((fila): fila is NonNullable<typeof fila> => fila !== null);

  const subtotal = detalle.reduce((suma, fila) => suma + fila.importe, 0);
  const rebaja = Math.min(subtotal, Math.max(0, leerMonto(descuento)));
  const total = Math.max(0, subtotal - rebaja);

  const pagos = mixto
    ? partes
        .map((parte) => ({ metodo: parte.metodo, monto: leerMonto(parte.monto) }))
        .filter((p) => p.monto > 0)
    : [{ metodo, monto: total }];
  const pagado = pagos.reduce((suma, p) => suma + p.monto, 0);
  const diferencia = Math.round((total - pagado) * 100) / 100;
  const hayFiado = pagos.some((p) => p.metodo === "fiado");
  const otra = enMoneda2(total, moneda2, tasa2);

  return (
    <form onSubmit={enviarSinBorrar(enviar)} className="pb-28">
      <input
        type="hidden"
        name="lineas"
        value={JSON.stringify(
          lineas.map(({ productoId, varianteId, cantidad }) => ({ productoId, varianteId, cantidad })),
        )}
      />
      <input type="hidden" name="pagos" value={JSON.stringify(pagos)} />
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="descuento" value={rebaja} />
      <input type="hidden" name="nota" value={nota} />
      {/* Solo para la venta sin señal: el servidor siempre calcula el suyo. */}
      <input type="hidden" name="total" value={total} />

      {recuperada && (
        <p
          role="status"
          className="mb-3 flex items-center gap-2 rounded-xl bg-crema px-3.5 py-2.5 text-[12px] text-gris"
        >
          <span className="flex-1">Recuperamos la venta que estabas haciendo.</span>
          <button
            type="button"
            onClick={empezarDeNuevo}
            className="shrink-0 font-bold text-rojo hover:underline"
          >
            Empezar de nuevo
          </button>
        </p>
      )}

      {estado.guardadaSinSenal && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          ✓ Venta guardada sin señal. Se envía sola cuando vuelva el internet.
        </p>
      )}

      {estado.error && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}

      {escaneando && (
        <EscanerCodigo
          alLeer={(codigo) => porCodigo(codigo)}
          alCerrar={() => setEscaneando(false)}
        />
      )}

      <div className="mb-3 flex gap-2">
        <input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          onKeyDown={(evento) => {
            // Un lector de códigos escribe el código y da Enter, como un teclado.
            if (evento.key === "Enter") {
              evento.preventDefault();
              if (porCodigo(busqueda) && !eligiendo) setBusqueda("");
            }
          }}
          placeholder="🔍 Nombre, código de barras o SKU"
          aria-label="Buscar producto"
          className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-[13.5px] shadow-sm outline-none placeholder:text-gris2"
        />
        <button
          type="button"
          onClick={() => setEscaneando((valor) => !valor)}
          aria-pressed={escaneando}
          className="shrink-0 rounded-xl bg-tinta px-4 text-[12.5px] font-extrabold text-white"
        >
          📷 Escanear
        </button>
      </div>

      {aviso && (
        <p
          role="status"
          className="mb-3 rounded-xl bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-gris shadow-sm"
        >
          {aviso}
        </p>
      )}

      {detalle.length > 0 && (
        <>
          <h2 className="mb-2 text-[13px] font-extrabold">Productos en esta venta</h2>
          <ul className="mb-4 space-y-2">
            {detalle.map(({ linea, producto, variante, precio, importe }) => (
              <li
                key={clave(linea)}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-crema text-xl">
                  {producto.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- viene de R2
                    <img src={`/media/${producto.foto}`} alt="" className="h-full w-full object-contain" />
                  ) : (
                    (producto.emoji ?? "📦")
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[13px] font-extrabold leading-tight">
                    {producto.nombre_es}
                  </span>
                  <span className="block text-[11.5px] text-gris">
                    {variante ? `${variante.nombre} · ` : ""}
                    {linea.cantidad} × {formatearPrecio(precio)}
                  </span>
                </span>
                <span className="flex items-center gap-1 rounded-xl border-[1.5px] border-linea p-0.5">
                  <button
                    type="button"
                    aria-label="Quitar uno"
                    onClick={() => sumar(linea.productoId, linea.varianteId, -1)}
                    className="grid h-7 w-7 place-items-center rounded-lg font-bold text-gris"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-[13px] font-extrabold">{linea.cantidad}</span>
                  <button
                    type="button"
                    aria-label="Agregar uno"
                    onClick={() => sumar(linea.productoId, linea.varianteId, 1)}
                    className="grid h-7 w-7 place-items-center rounded-lg font-bold text-gris"
                  >
                    +
                  </button>
                </span>
                <span className="w-16 shrink-0 text-right text-[13px] font-black">
                  {formatearPrecio(importe)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {detalle.length > 0 && (
        <section aria-label="Cobro" className="mb-4 rounded-2xl bg-white p-3.5 shadow-sm">
          <h2 className="mb-2 text-[13px] font-extrabold">¿Cómo te pagan?</h2>
          <div className="sin-barra mb-2 flex gap-2 overflow-x-auto">
            {METODOS_PAGO.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => {
                  setMixto(false);
                  setMetodo(opcion.valor);
                }}
                aria-pressed={!mixto && metodo === opcion.valor}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition ${
                  !mixto && metodo === opcion.valor
                    ? "border-tinta bg-tinta text-white"
                    : "border-linea bg-white text-gris"
                }`}
              >
                {opcion.texto}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMixto(true)}
              aria-pressed={mixto}
              className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition ${
                mixto ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-gris"
              }`}
            >
              🔀 Mixto
            </button>
          </div>

          {mixto && (
            <div className="mb-2 space-y-2 rounded-xl bg-crema p-2.5">
              {partes.map((parte, indice) => (
                <div key={indice} className="flex gap-2">
                  <select
                    value={parte.metodo}
                    onChange={(evento) =>
                      setPartes((actuales) =>
                        actuales.map((p, i) =>
                          i === indice ? { ...p, metodo: evento.target.value as MetodoPago } : p,
                        ),
                      )
                    }
                    aria-label="Método de pago"
                    className="min-w-0 flex-1 rounded-xl border-[1.5px] border-linea bg-white px-3 py-2 text-[12.5px] font-semibold outline-none"
                  >
                    {METODOS_PAGO.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.texto}
                      </option>
                    ))}
                  </select>
                  <input
                    value={parte.monto}
                    onChange={(evento) =>
                      setPartes((actuales) =>
                        actuales.map((p, i) => (i === indice ? { ...p, monto: evento.target.value } : p)),
                      )
                    }
                    inputMode="decimal"
                    placeholder="Monto"
                    aria-label="Monto de este pago"
                    className="w-28 rounded-xl border-[1.5px] border-linea bg-white px-3 py-2 text-[12.5px] font-semibold outline-none"
                  />
                  {partes.length > 2 && (
                    <button
                      type="button"
                      aria-label="Quitar este pago"
                      onClick={() => setPartes((actuales) => actuales.filter((_, i) => i !== indice))}
                      className="px-1 text-gris"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setPartes((actuales) => [...actuales, { metodo: "tarjeta", monto: "" }])
                  }
                  className="text-[12px] font-bold text-rojo"
                >
                  + Otro método
                </button>
                <span
                  className={`text-[12px] font-extrabold ${
                    diferencia === 0 ? "text-verde" : "text-rojo-oscuro"
                  }`}
                >
                  {diferencia === 0
                    ? "Pagos completos"
                    : diferencia > 0
                      ? `Falta ${formatearPrecio(diferencia)}`
                      : `Sobra ${formatearPrecio(-diferencia)}`}
                </span>
              </div>
            </div>
          )}

          <div className="mb-2 flex gap-2">
            <select
              value={clienteId}
              onChange={(evento) => setClienteId(evento.target.value)}
              aria-label="Cliente"
              className={`min-w-0 flex-1 rounded-xl border-[1.5px] px-3 py-2.5 text-[12.5px] font-semibold outline-none ${
                hayFiado && !clienteId ? "border-rojo" : "border-linea"
              }`}
            >
              <option value="">{hayFiado ? "Elige el cliente (fiado)" : "Cliente (opcional)"}</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
            <input
              value={descuento}
              onChange={(evento) => setDescuento(evento.target.value)}
              inputMode="decimal"
              placeholder="Descuento"
              aria-label="Descuento"
              className="w-28 rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[12.5px] font-semibold outline-none placeholder:font-normal placeholder:text-gris2"
            />
          </div>

          <input
            value={nota}
            onChange={(evento) => setNota(evento.target.value)}
            maxLength={200}
            placeholder="Nota para el comprobante (opcional)"
            aria-label="Nota para el comprobante"
            className="mb-2 w-full rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[12.5px] font-semibold outline-none placeholder:font-normal placeholder:text-gris2"
          />
        </section>
      )}

      <h2 className="mb-2 text-[13px] font-extrabold">
        {busqueda ? "Resultados" : "Tus productos"}
      </h2>
      {encontrados.length === 0 && (
        <p className="rounded-2xl bg-white p-5 text-center text-[13px] text-gris shadow-sm">
          No hay productos con esa búsqueda.{" "}
          <Link href="/panel/inventario/nuevo" className="font-bold text-rojo">
            Crear producto
          </Link>
        </p>
      )}
      <ul className="space-y-2">
        {encontrados.map((producto) => {
          const disponible = producto.es_servicio
            ? true
            : producto.variantes.length > 0
              ? producto.variantes.some((v) => v.stock > 0)
              : producto.stock > 0;
          return (
            <li key={producto.id}>
              <button
                type="button"
                disabled={!disponible}
                onClick={() => elegir(producto)}
                aria-expanded={producto.variantes.length > 0 ? eligiendo === producto.id : undefined}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition enabled:hover:shadow-md disabled:opacity-50"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-crema text-xl">
                  {producto.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- viene de R2
                    <img src={`/media/${producto.foto}`} alt="" className="h-full w-full object-contain" />
                  ) : (
                    (producto.emoji ?? "📦")
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold">
                    {producto.nombre_es}
                  </span>
                  <span className="block text-[11.5px] text-gris">
                    {producto.es_servicio
                      ? "Servicio"
                      : producto.variantes.length > 0
                        ? `${producto.variantes.length} opciones · ${producto.variantes.reduce((s, v) => s + v.stock, 0)} disponibles`
                        : producto.stock > 0
                          ? `${producto.stock} disponibles`
                          : "Agotado"}
                  </span>
                </span>
                <span className="text-[13px] font-black">{formatearPrecio(producto.precio)}</span>
              </button>

              {eligiendo === producto.id && (
                <div className="mt-1.5 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
                  {producto.variantes.map((variante) => (
                    <button
                      key={variante.id}
                      type="button"
                      disabled={variante.stock <= 0}
                      onClick={() => {
                        sumar(producto.id, variante.id, 1);
                        setEligiendo(null);
                      }}
                      className="rounded-xl border-[1.5px] border-linea px-3.5 py-2 text-[12.5px] font-bold transition enabled:hover:border-tinta disabled:opacity-40"
                    >
                      {variante.nombre}
                      {variante.precioExtra > 0 && ` +${formatearPrecio(variante.precioExtra)}`}
                      <span className="ml-1.5 text-[11px] font-semibold text-gris">
                        ({variante.stock})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-[74px] z-30 border-t border-linea bg-white p-3.5 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-14rem)] md:max-w-3xl">
        <button
          type="submit"
          disabled={enviando || detalle.length === 0 || (mixto && diferencia !== 0)}
          className="w-full rounded-2xl bg-rojo py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-50"
        >
          {enviando ? "Registrando…" : `Registrar venta · ${formatearPrecio(total)}`}
        </button>
        {otra && <p className="mt-1.5 text-center text-[11.5px] font-bold text-gris">{otra}</p>}
        {mixto && diferencia !== 0 && detalle.length > 0 && (
          <p className="mt-1.5 text-center text-[11px] text-gris">
            La suma de los pagos tiene que ser igual al total para registrar.
          </p>
        )}
      </div>
    </form>
  );
}
