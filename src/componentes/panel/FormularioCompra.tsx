"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { enviarSinBorrar } from "@/componentes/enviar-sin-borrar";
import {
  borrarBorradorDe,
  guardarBorradorDe,
  leerBorradorDe,
  useDuenoBorrador,
} from "@/componentes/GuardaBorrador";
import { registrarCompra, type ResultadoCompra } from "@/app/panel/(dentro)/compras/acciones";
import { formatearPrecio } from "@/lib/i18n";
import { leerMonto } from "@/lib/numeros";
import type { ClienteSimple, ProductoVenta } from "@/lib/negocio";

/**
 * Registrar mercancía que llegó del proveedor. Se busca el producto, se dice
 * cuántas unidades llegaron y a qué costo, y al guardar el stock sube y el
 * costo se recalcula como promedio. Lo escrito se guarda solo.
 */

type Linea = { productoId: number; varianteId: number | null; cantidad: string; costo: string };
type Borrador = {
  lineas: Linea[];
  proveedorId: string;
  factura: string;
  metodo: string;
  nota: string;
};

const METODOS = [
  { valor: "efectivo", texto: "💵 Efectivo" },
  { valor: "transferencia", texto: "🏦 Transferencia" },
  { valor: "tarjeta", texto: "💳 Tarjeta" },
  { valor: "credito", texto: "🕐 A crédito" },
];

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[13px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

export function FormularioCompra({
  productos,
  proveedores,
}: {
  productos: ProductoVenta[];
  proveedores: ClienteSimple[];
}) {
  const [estado, enviar, enviando] = useActionState<ResultadoCompra, FormData>(registrarCompra, {});
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [proveedorId, setProveedorId] = useState("");
  const [factura, setFactura] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [nota, setNota] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [recuperada, setRecuperada] = useState(false);
  const dueno = useDuenoBorrador();
  const primeraVez = useRef(true);
  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const fisicos = useMemo(() => productos.filter((p) => !p.es_servicio), [productos]);

  useEffect(() => {
    const espera = window.setTimeout(() => {
      const guardado = leerBorradorDe<Borrador>("compra-nueva", dueno);
      if (!guardado || !Array.isArray(guardado.lineas)) return;
      const validas = guardado.lineas.filter((l) => porId.has(l.productoId));
      if (validas.length === 0 && !guardado.factura && !guardado.proveedorId) return;
      setLineas(validas);
      setProveedorId(guardado.proveedorId ?? "");
      setFactura(guardado.factura ?? "");
      setMetodo(guardado.metodo ?? "efectivo");
      setNota(guardado.nota ?? "");
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
      if (lineas.length === 0 && !factura && !proveedorId && !nota) borrarBorradorDe("compra-nueva", dueno);
      else
        guardarBorradorDe("compra-nueva", dueno, {
          lineas,
          proveedorId,
          factura,
          metodo,
          nota,
        } satisfies Borrador);
    }, 500);
    return () => window.clearTimeout(espera);
  }, [lineas, proveedorId, factura, metodo, nota, dueno]);

  const encontrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return fisicos
      .filter(
        (p) =>
          p.nombre_es.toLowerCase().includes(q) ||
          p.codigo_barras?.toLowerCase() === q ||
          p.sku?.toLowerCase() === q,
      )
      .slice(0, 8);
  }, [busqueda, fisicos]);

  function agregar(producto: ProductoVenta) {
    setLineas((actuales) => [
      ...actuales,
      {
        productoId: producto.id,
        varianteId: producto.variantes[0]?.id ?? null,
        cantidad: "1",
        costo: producto.costo > 0 ? String(producto.costo) : "",
      },
    ]);
    setBusqueda("");
  }

  function cambiar(indice: number, cambio: Partial<Linea>) {
    setLineas((actuales) => actuales.map((l, i) => (i === indice ? { ...l, ...cambio } : l)));
  }

  const total = lineas.reduce(
    (suma, l) => suma + Math.max(0, Math.round(leerMonto(l.cantidad))) * Math.max(0, leerMonto(l.costo)),
    0,
  );

  return (
    <form onSubmit={enviarSinBorrar(enviar)} className="space-y-3">
      <input
        type="hidden"
        name="lineas"
        value={JSON.stringify(
          lineas.map((l) => ({
            productoId: l.productoId,
            varianteId: l.varianteId,
            cantidad: Math.round(leerMonto(l.cantidad)),
            costo: l.costo,
          })),
        )}
      />
      <input type="hidden" name="proveedor_id" value={proveedorId} />
      <input type="hidden" name="factura" value={factura} />
      <input type="hidden" name="metodo_pago" value={metodo} />
      <input type="hidden" name="nota" value={nota} />

      {recuperada && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-crema px-3.5 py-2.5 text-[12px] text-gris">
          <span className="flex-1">Recuperamos la compra que estabas registrando.</span>
          <button
            type="button"
            onClick={() => {
              borrarBorradorDe("compra-nueva", dueno);
              setLineas([]);
              setProveedorId("");
              setFactura("");
              setNota("");
              setRecuperada(false);
            }}
            className="shrink-0 font-bold text-rojo hover:underline"
          >
            Empezar de nuevo
          </button>
        </p>
      )}

      {estado.error && (
        <p
          role="alert"
          className="rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <label htmlFor="proveedor" className="mb-1.5 block text-[12px] font-bold text-gris">
              Proveedor
            </label>
            <select
              id="proveedor"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className={CAMPO}
            >
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="factura" className="mb-1.5 block text-[12px] font-bold text-gris">
              Número de factura
            </label>
            <input
              id="factura"
              value={factura}
              onChange={(e) => setFactura(e.target.value)}
              placeholder="Opcional"
              className={CAMPO}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-[13px] font-extrabold">Lo que llegó</h2>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Busca el producto por nombre o código"
          aria-label="Buscar producto"
          className={CAMPO}
        />
        {encontrados.length > 0 && (
          <ul className="mt-1.5 overflow-hidden rounded-xl border border-linea">
            {encontrados.map((producto) => (
              <li key={producto.id}>
                <button
                  type="button"
                  onClick={() => agregar(producto)}
                  className="flex w-full justify-between gap-3 border-b border-linea px-3 py-2.5 text-left text-[12.5px] last:border-0 hover:bg-crema"
                >
                  <span className="font-bold">{producto.nombre_es}</span>
                  <span className="text-gris">{producto.stock} en stock</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {lineas.length === 0 ? (
          <p className="mt-3 text-[12px] text-gris">Todavía no agregaste productos.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {lineas.map((linea, indice) => {
              const producto = porId.get(linea.productoId);
              if (!producto) return null;
              return (
                <li key={indice} className="rounded-xl bg-crema p-3">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-[13px] font-extrabold">{producto.nombre_es}</p>
                    <button
                      type="button"
                      aria-label="Quitar este producto"
                      onClick={() => setLineas((a) => a.filter((_, i) => i !== indice))}
                      className="text-gris"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-[11px] text-gris">
                    Hoy: {producto.stock} en stock · costo {formatearPrecio(producto.costo)}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {producto.variantes.length > 0 && (
                      <select
                        value={linea.varianteId ?? ""}
                        onChange={(e) => cambiar(indice, { varianteId: Number(e.target.value) || null })}
                        aria-label="Color o talla"
                        className={`${CAMPO} col-span-2 bg-white sm:col-span-1`}
                      >
                        {producto.variantes.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      value={linea.cantidad}
                      onChange={(e) => cambiar(indice, { cantidad: e.target.value })}
                      inputMode="numeric"
                      placeholder="Cantidad"
                      aria-label="Cantidad que llegó"
                      className={`${CAMPO} bg-white`}
                    />
                    <input
                      value={linea.costo}
                      onChange={(e) => cambiar(indice, { costo: e.target.value })}
                      inputMode="decimal"
                      placeholder="Costo unitario"
                      aria-label="Costo por unidad"
                      className={`${CAMPO} bg-white`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-[13px] font-extrabold">¿Cómo la pagaste?</h2>
        <div className="flex flex-wrap gap-2">
          {METODOS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setMetodo(opcion.valor)}
              aria-pressed={metodo === opcion.valor}
              className={`rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition ${
                metodo === opcion.valor ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-gris"
              }`}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] text-gris">
          {metodo === "efectivo"
            ? "Efectivo es la plata del cajón: la caja la descuenta. Si pagaste por banco, elige Transferencia."
            : metodo === "credito"
              ? "A crédito: el proveedor te fía y no sale plata de la caja."
              : "No sale plata del cajón: la caja no la descuenta."}
        </p>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota (opcional)"
          aria-label="Nota"
          className={`${CAMPO} mt-3`}
        />
      </div>

      <button
        type="submit"
        disabled={enviando || lineas.length === 0}
        className="w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-50"
      >
        {enviando ? "Registrando…" : `Registrar compra · ${formatearPrecio(total)}`}
      </button>
      <p className="text-center text-[11.5px] text-gris">
        El stock sube y el costo de cada producto se recalcula como promedio.
      </p>
    </form>
  );
}
