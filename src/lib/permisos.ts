/**
 * Permisos por módulo, persona por persona.
 *
 * Cada rol trae lo suyo por defecto (lo mismo que Treinta: quién vende, quién
 * ve la ganancia, quién carga productos), y el propietario puede prender o
 * apagar cada módulo para cada persona desde Equipo. El propietario siempre
 * puede todo.
 *
 * Este archivo no toca la base: así se puede usar en el navegador para
 * esconder botones, y en el servidor para que la regla se cumpla de verdad.
 */

export type Rol = "dueno" | "vendedor" | "bodega";

export const MODULOS = [
  { clave: "vender", texto: "Registrar ventas" },
  { clave: "anular", texto: "Anular ventas" },
  { clave: "caja", texto: "Abrir y cerrar caja" },
  { clave: "gastos", texto: "Registrar gastos" },
  { clave: "pedidos", texto: "Pedidos de la tienda" },
  { clave: "inventario", texto: "Crear y editar productos" },
  { clave: "costos", texto: "Ver costos y ganancia" },
  { clave: "compras", texto: "Compras a proveedores" },
  { clave: "conteo", texto: "Conteo de inventario" },
  { clave: "clientes", texto: "Clientes y cuentas por cobrar" },
  { clave: "cotizaciones", texto: "Cotizaciones" },
  { clave: "reportes", texto: "Balance, estadísticas y reportes" },
] as const;

export type Modulo = (typeof MODULOS)[number]["clave"];

const POR_ROL: Record<Exclude<Rol, "dueno">, Modulo[]> = {
  vendedor: ["vender", "caja", "pedidos", "clientes", "cotizaciones"],
  bodega: ["vender", "pedidos", "inventario", "compras", "conteo", "gastos"],
};

export type Permisos = Partial<Record<Modulo, boolean>>;

/** Lee lo que guardó el propietario; si viene roto, se usa lo del rol. */
export function leerPermisos(texto: string | null | undefined): Permisos {
  if (!texto) return {};
  try {
    const crudo = JSON.parse(texto) as Record<string, unknown>;
    const limpio: Permisos = {};
    for (const { clave } of MODULOS) {
      if (typeof crudo[clave] === "boolean") limpio[clave] = crudo[clave] as boolean;
    }
    return limpio;
  } catch {
    return {};
  }
}

export function puedeUsar(
  usuario: { rol: Rol; permisos?: Permisos } | null | undefined,
  modulo: Modulo,
): boolean {
  if (!usuario) return false;
  if (usuario.rol === "dueno") return true;
  const propio = usuario.permisos?.[modulo];
  if (typeof propio === "boolean") return propio;
  return POR_ROL[usuario.rol]?.includes(modulo) ?? false;
}

/** Lo que ve cada rol si nadie lo cambia: para mostrarlo en Equipo. */
export function porDefecto(rol: Rol, modulo: Modulo): boolean {
  return rol === "dueno" || (POR_ROL[rol as Exclude<Rol, "dueno">]?.includes(modulo) ?? false);
}
