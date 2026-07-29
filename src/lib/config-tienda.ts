/**
 * Ajustes que el dueño edita en "Mi tienda" y que la tienda pública debe
 * respetar de verdad.
 *
 * Antes vivían en constantes del código: el dueño los cambiaba en el panel y
 * la tienda seguía igual. Una configuración que no hace nada es peor que no
 * tenerla.
 */

import { baseDeDatos } from "./d1";
import { NEGOCIO } from "./config";

export type ConfigTienda = {
  whatsapp: string;
  costoEnvio: number;
  mostrarStock: boolean;
  ocultarAgotados: boolean;
  correo: string;
  direccion: string;
};

const POR_DEFECTO: ConfigTienda = {
  whatsapp: NEGOCIO.whatsapp,
  costoEnvio: NEGOCIO.costoEnvio,
  mostrarStock: true,
  ocultarAgotados: false,
  correo: "",
  direccion: "",
};

export async function obtenerConfigTienda(): Promise<ConfigTienda> {
  const db = await baseDeDatos();
  if (!db) return POR_DEFECTO;

  const fila = await db
    .prepare(
      `SELECT whatsapp, correo, direccion, costo_envio, mostrar_stock, ocultar_agotados
       FROM negocio WHERE id = 1`,
    )
    .first<{
      whatsapp: string | null;
      correo: string | null;
      direccion: string | null;
      costo_envio: number | null;
      mostrar_stock: number | null;
      ocultar_agotados: number | null;
    }>()
    .catch(() => null);

  if (!fila) return POR_DEFECTO;

  return {
    // El número del panel manda; la variable de entorno queda como respaldo.
    whatsapp: (fila.whatsapp ?? "").replace(/\D/g, "") || NEGOCIO.whatsapp,
    costoEnvio: fila.costo_envio ?? NEGOCIO.costoEnvio,
    mostrarStock: (fila.mostrar_stock ?? 1) === 1,
    ocultarAgotados: (fila.ocultar_agotados ?? 0) === 1,
    correo: fila.correo ?? "",
    direccion: fila.direccion ?? "",
  };
}
