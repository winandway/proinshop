"use client";

import { useActionState, useState } from "react";
import type { ResultadoProducto } from "@/app/panel/(dentro)/inventario/acciones";

export type CategoriaSimple = { id: number; nombre: string };

export type ProductoFormulario = {
  id: number;
  nombre: string;
  nombreIngles: string;
  descripcion: string;
  sku: string;
  codigoBarras: string;
  costo: number;
  precio: number;
  stock: number;
  categoriaId: number | null;
  publicado: boolean;
  foto: string | null;
};

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold text-tinta outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

/**
 * Mismo orden de campos que la app que el dueño ya usa: foto, código de
 * barras, nombre, cantidad, precio, costo, categoría y "mostrar en tienda".
 */
export function FormularioProducto({
  accion,
  categorias,
  producto,
  boton,
}: {
  accion: (previo: ResultadoProducto, datos: FormData) => Promise<ResultadoProducto>;
  categorias: CategoriaSimple[];
  producto?: ProductoFormulario;
  boton: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, {});
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(
    producto?.foto ? `/media/${producto.foto}` : null,
  );

  return (
    <form action={enviar} className="space-y-4">
      {producto && <input type="hidden" name="id" value={producto.id} />}

      {estado.error && (
        <p
          role="alert"
          className="rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro"
        >
          {estado.error}
        </p>
      )}

      <div className="flex items-start gap-3">
        <label className="cursor-pointer">
          <span className="sr-only">Foto del producto</span>
          <input
            type="file"
            name="foto"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0];
              if (archivo) setVistaPrevia(URL.createObjectURL(archivo));
            }}
          />
          <span
            className={`grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border-[1.5px] text-center ${
              vistaPrevia ? "border-linea bg-white" : "border-dashed border-[#a9b0bc] bg-[#edf0f5]"
            }`}
          >
            {vistaPrevia ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local o del bucket
              <img src={vistaPrevia} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="px-2 text-[11.5px] font-bold text-[#3d5afe]">
                <span aria-hidden="true" className="block text-2xl">
                  ⬆
                </span>
                Cargar imagen
              </span>
            )}
          </span>
        </label>

        <p className="flex-1 rounded-xl bg-crema p-3 text-[11.5px] leading-relaxed text-gris">
          Toma la foto con la cámara del celular. Se sube sola y aparece en la
          tienda al guardar.
        </p>
      </div>

      <div>
        <label htmlFor="codigo_barras" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Código de barras
        </label>
        <input
          id="codigo_barras"
          name="codigo_barras"
          defaultValue={producto?.codigoBarras}
          placeholder="Escribe el código o escanéalo"
          className={CAMPO}
        />
      </div>

      <div>
        <label htmlFor="nombre" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Nombre del producto <span className="text-rojo">*</span>
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={producto?.nombre}
          placeholder="Nombre del producto"
          className={CAMPO}
        />
      </div>

      <div>
        <label htmlFor="nombre_en" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Nombre en inglés
        </label>
        <input
          id="nombre_en"
          name="nombre_en"
          defaultValue={producto?.nombreIngles}
          placeholder="Product name"
          className={CAMPO}
        />
        <p className="mt-1.5 text-[11.5px] text-gris2">
          Si lo dejas vacío, en la tienda en inglés se muestra el nombre en español.
        </p>
      </div>

      <div>
        <label htmlFor="stock" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Cantidad disponible
        </label>
        <input
          id="stock"
          name="stock"
          type="number"
          min="0"
          inputMode="numeric"
          defaultValue={producto?.stock ?? 0}
          className={CAMPO}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="precio" className="mb-1.5 block text-[12.5px] font-bold text-gris">
            Precio <span className="text-rojo">*</span>
          </label>
          <input
            id="precio"
            name="precio"
            required
            inputMode="decimal"
            defaultValue={producto?.precio || ""}
            placeholder="$ 0"
            className={CAMPO}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="costo" className="mb-1.5 block text-[12.5px] font-bold text-gris">
            Costo
          </label>
          <input
            id="costo"
            name="costo"
            inputMode="decimal"
            defaultValue={producto?.costo || ""}
            placeholder="$ 0"
            className={CAMPO}
          />
        </div>
      </div>
      <p className="-mt-2 text-[11.5px] text-gris2">
        El costo no se muestra al público: sirve para saber tu ganancia real.
      </p>

      <div>
        <label htmlFor="categoria_id" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Categoría
        </label>
        <select
          id="categoria_id"
          name="categoria_id"
          defaultValue={producto?.categoriaId ?? ""}
          className={CAMPO}
        >
          <option value="">Selecciona una opción</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          Descripción para la tienda
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={producto?.descripcion}
          placeholder="Para qué sirve, de qué material es, qué incluye…"
          className={`${CAMPO} resize-y`}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] border-verde bg-verde-suave p-3.5">
        <span aria-hidden="true" className="text-lg">
          🏪
        </span>
        <span className="flex-1">
          <span className="block text-[13px] font-extrabold">Mostrar en tienda virtual</span>
          <span className="block text-[11px] leading-snug text-[#3d6b52]">
            Este producto será visible para tus clientes en proinshop.com
          </span>
        </span>
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={producto ? producto.publicado : true}
          className="h-5 w-5 accent-verde"
        />
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro disabled:opacity-60"
      >
        {enviando ? "Guardando…" : boton}
      </button>
    </form>
  );
}
