import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { guardarVenta } from "@/lib/registrar-venta";
import { sitioDeLlave } from "@/lib/llaves";
import { usuarioQuePuede } from "@/lib/sesion";

/**
 * Recibe las ventas que se hicieron sin señal, una por una, cuando vuelve el
 * internet.
 *
 * Es una dirección fija y no una acción del servidor a propósito: la página
 * que guardó la venta pudo haberse abierto antes de una publicación nueva, y
 * las acciones cambian de nombre en cada publicación. Esta dirección no.
 */
export async function POST(peticion: Request) {
  // Solo desde el propio panel: la cookie de sesión no viaja desde otros
  // sitios, y además se comprueba de dónde viene.
  const origen = peticion.headers.get("origin");
  if (origen && !sitioDeLlave(origen)) {
    return Response.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const usuario = await usuarioQuePuede("vender");
  if (!usuario) {
    return Response.json(
      { error: "Tu sesión venció o tu cuenta ya no puede vender. Entra otra vez." },
      { status: 401 },
    );
  }
  const db = await baseDeDatos();
  if (!db) return Response.json({ error: "La base de datos no está disponible" }, { status: 503 });

  let venta: Record<string, unknown>;
  try {
    venta = await peticion.json();
  } catch {
    return Response.json({ error: "No se pudo leer la venta" }, { status: 400 });
  }

  const resultado = await guardarVenta(db, usuario.id, {
    lineas: venta.lineas,
    pagos: venta.pagos,
    clienteId: venta.cliente_id,
    descuento: venta.descuento,
    nota: venta.nota,
    clave: venta.clave,
    fecha: venta.fecha,
    sinSenal: true,
  });
  if ("error" in resultado) return Response.json(resultado, { status: 422 });

  revalidatePath("/panel");
  revalidatePath("/panel/inventario");
  revalidatePath("/");
  return Response.json({ id: resultado.id, repetida: resultado.repetida ?? false });
}
