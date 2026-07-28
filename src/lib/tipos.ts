/**
 * Tipos del catálogo. Reflejan exactamente las tablas de `db/schema.sql`,
 * para que al conectar D1 en la Etapa 3 no haya que tocar las pantallas.
 */

export type Idioma = "es" | "en";

/** Todo texto de cara al público se guarda en los dos idiomas. */
export type Texto = { es: string; en: string };

export type Categoria = {
  id: number;
  slug: string;
  nombre: Texto;
  /** Ícono provisional mientras el dueño no haya subido la foto de portada. */
  emoji: string;
  orden: number;
  visible: boolean;
};

export type Variante = {
  id: number;
  nombre: Texto;
  stock: number;
  /** Cuánto suma o resta al precio base del producto. */
  precioExtra: number;
};

export type Especificacion = {
  etiqueta: Texto;
  valor: Texto;
};

export type Producto = {
  id: number;
  slug: string;
  categoriaSlug: string;
  nombre: Texto;
  descripcion: Texto;
  /** Precio de venta al público, en dólares. */
  precio: number;
  /** Precio tachado, solo si el producto está en promoción. */
  precioAnterior?: number;
  /** Costo de importación. Nunca se muestra al público. */
  costo: number;
  stock: number;
  sku: string;
  publicado: boolean;
  destacado: boolean;
  etiqueta?: Texto;
  emoji: string;
  /** Claves de R2 de las fotos. Vacío mientras no se haya cargado ninguna. */
  fotos: string[];
  variantes: Variante[];
  especificaciones: Especificacion[];
};

export type LineaCarrito = {
  productoSlug: string;
  varianteId: number | null;
  cantidad: number;
};

export type MetodoEntrega = "domicilio" | "local";
export type MetodoPago = "transferencia" | "tarjeta" | "contraentrega";
