import { baseDeDatos } from "@/lib/d1";
import { puede, usuarioActual } from "@/lib/sesion";

/**
 * Lo que el panel pregunta cada medio minuto para avisar sin recargar: el
 * último pedido de la tienda y la última actividad del equipo. Responde poco
 * y rápido; no guarda nada.
 */
export async function GET() {
  const usuario = await usuarioActual();
  if (!usuario) return Response.json({}, { status: 401 });
  const db = await baseDeDatos();
  if (!db) return Response.json({});

  const [pedido, actividad] = await Promise.all([
    puede(usuario, "pedidos")
      ? db
          .prepare(
            `SELECT id, numero, total, cliente_nombre,
                    (SELECT COUNT(*) FROM pedido WHERE estado = 'nuevo') AS nuevos
             FROM pedido ORDER BY id DESC LIMIT 1`,
          )
          .first<{ id: number; numero: string; total: number; cliente_nombre: string; nuevos: number }>()
      : null,
    usuario.rol === "dueno"
      ? db
          .prepare(
            `SELECT a.id, a.detalle, u.nombre FROM actividad a LEFT JOIN usuario u ON u.id = a.usuario_id
             WHERE a.usuario_id != ? ORDER BY a.id DESC LIMIT 1`,
          )
          .bind(usuario.id)
          .first<{ id: number; detalle: string; nombre: string | null }>()
      : null,
  ]);

  return Response.json(
    { pedido, actividad },
    { headers: { "cache-control": "private, no-store" } },
  );
}
