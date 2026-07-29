"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarVenta, type ResultadoVenta } from "@/app/panel/(dentro)/vender/acciones";
import { formatearPrecio } from "@/lib/i18n";
import type { ClienteSimple, ProductoVenta } from "@/lib/negocio";
import { METODOS_PAGO } from "@/lib/negocio";

export function PantallaVender({
  productos,
  clientes,
}: {
  productos: ProductoVenta[];
  clientes: ClienteSimple[];
}) {
  const [estado, enviar, enviando] = useActionState<ResultadoVenta, FormData>(registrarVenta, {});
  const [busqueda, setBusqueda] = useState("");
  const [lineas, setLineas] = useState<Record<number, number>>({});
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [clienteId, setClienteId] = useState("");
  const [descuento, setDescuento] = useState("");

  const encontrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos.slice(0, 8);
    return productos
      .filter((p) => p.nombre_es.toLowerCase().includes(q))
      .slice(0, 12);
  }, [busqueda, productos]);

  const seleccionados = productos.filter((p) => (lineas[p.id] ?? 0) > 0);
  const subtotal = seleccionados.reduce((suma, p) => suma + p.precio * lineas[p.id], 0);
  const rebaja = Math.max(0, Number(descuento.replace(",", ".")) || 0);
  const total = Math.max(0, subtotal - rebaja);

  function cambiar(id: number, delta: number, tope: number) {
    setLineas((actuales) => {
      const cantidad = Math.min(tope, Math.max(0, (actuales[id] ?? 0) + delta));
      const copia = { ...actuales };
      if (cantidad === 0) delete copia[id];
      else copia[id] = cantidad;
      return copia;
    });
  }

  return (
    <form action={enviar} className="pb-44">
      <input
        type="hidden"
        name="lineas"
        value={JSON.stringify(
          seleccionados.map((p) => ({ productoId: p.id, cantidad: lineas[p.id], precio: p.precio })),
        )}
      />
      <input type="hidden" name="metodo_pago" value={metodoPago} />
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="descuento" value={rebaja} />

      {estado.error && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}

      <input
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        placeholder="🔍 Buscar producto"
        className="mb-3 w-full rounded-xl bg-white px-4 py-3 text-[13.5px] shadow-sm outline-none placeholder:text-gris2"
      />

      {seleccionados.length > 0 && (
        <>
          <h2 className="mb-2 text-[13px] font-extrabold">Productos en esta venta</h2>
          <ul className="mb-4 space-y-2">
            {seleccionados.map((producto) => (
              <li
                key={producto.id}
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
                  <span className="block truncate text-[13px] font-extrabold">
                    {producto.nombre_es}
                  </span>
                  <span className="block text-[11.5px] text-gris">
                    {lineas[producto.id]} × {formatearPrecio(producto.precio)}
                  </span>
                </span>
                <span className="flex items-center gap-1 rounded-xl border-[1.5px] border-linea p-0.5">
                  <button
                    type="button"
                    aria-label="Quitar uno"
                    onClick={() => cambiar(producto.id, -1, producto.stock)}
                    className="grid h-7 w-7 place-items-center rounded-lg font-bold text-gris"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-[13px] font-extrabold">
                    {lineas[producto.id]}
                  </span>
                  <button
                    type="button"
                    aria-label="Agregar uno"
                    onClick={() => cambiar(producto.id, 1, producto.stock)}
                    className="grid h-7 w-7 place-items-center rounded-lg font-bold text-gris"
                  >
                    +
                  </button>
                </span>
                <span className="w-16 shrink-0 text-right text-[13px] font-black">
                  {formatearPrecio(producto.precio * lineas[producto.id])}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mb-2 text-[13px] font-extrabold">
        {busqueda ? "Resultados" : "Tus productos"}
      </h2>
      <ul className="space-y-2">
        {encontrados.map((producto) => (
          <li key={producto.id}>
            <button
              type="button"
              disabled={producto.stock <= 0}
              onClick={() => cambiar(producto.id, 1, producto.stock)}
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
                  {producto.stock > 0 ? `${producto.stock} disponibles` : "Agotado"}
                </span>
              </span>
              <span className="text-[13px] font-black">{formatearPrecio(producto.precio)}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-[74px] z-30 border-t border-linea bg-white p-3.5 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-14rem)] md:max-w-3xl">
        <div className="sin-barra mb-2 flex gap-2 overflow-x-auto">
          {METODOS_PAGO.map((metodo) => (
            <button
              key={metodo.valor}
              type="button"
              onClick={() => setMetodoPago(metodo.valor)}
              aria-pressed={metodoPago === metodo.valor}
              className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[11.5px] font-bold transition ${
                metodoPago === metodo.valor
                  ? "border-tinta bg-tinta text-white"
                  : "border-linea bg-white text-gris"
              }`}
            >
              {metodo.texto}
            </button>
          ))}
        </div>

        <div className="mb-2 flex gap-2">
          <select
            value={clienteId}
            onChange={(evento) => setClienteId(evento.target.value)}
            className="min-w-0 flex-1 rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[12.5px] font-semibold outline-none"
          >
            <option value="">Cliente (opcional)</option>
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
            className="w-28 rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[12.5px] font-semibold outline-none placeholder:font-normal placeholder:text-gris2"
          />
        </div>

        <button
          type="submit"
          disabled={enviando || seleccionados.length === 0}
          className="w-full rounded-2xl bg-rojo py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-50"
        >
          {enviando ? "Registrando…" : `Registrar venta · ${formatearPrecio(total)}`}
        </button>
      </div>
    </form>
  );
}
