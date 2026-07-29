import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { datosNegocio } from "@/lib/negocio";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mi tienda", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

async function guardarTienda(datos: FormData) {
  "use server";

  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "dueno") return;

  const db = await baseDeDatos();
  if (!db) return;

  // Solo dígitos: es lo que espera el enlace de WhatsApp.
  const whatsapp = String(datos.get("whatsapp") ?? "").replace(/\D/g, "");
  const envio = Number(String(datos.get("costo_envio") ?? "0").replace(",", ".")) || 0;

  await db
    .prepare(
      `INSERT INTO negocio (id, nombre, dominio, whatsapp, correo, direccion, costo_envio,
                            mostrar_stock, ocultar_agotados)
       VALUES (1, ?, 'proinshop.com', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         nombre = excluded.nombre, whatsapp = excluded.whatsapp, correo = excluded.correo,
         direccion = excluded.direccion, costo_envio = excluded.costo_envio,
         mostrar_stock = excluded.mostrar_stock, ocultar_agotados = excluded.ocultar_agotados`,
    )
    .bind(
      String(datos.get("nombre") ?? "Proinshop").trim(),
      whatsapp || null,
      String(datos.get("correo") ?? "").trim() || null,
      String(datos.get("direccion") ?? "").trim() || null,
      envio,
      datos.get("mostrar_stock") === "on" ? 1 : 0,
      datos.get("ocultar_agotados") === "on" ? 1 : 0,
    )
    .run();

  revalidatePath("/panel/tienda");
  revalidatePath("/");
  redirect("/panel/tienda?guardado=1");
}

export default async function MiTienda({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");
  if (usuario.rol !== "dueno") redirect("/panel");

  const { guardado } = await searchParams;
  const negocio = await datosNegocio();
  const db = await baseDeDatos();

  const cifras = db
    ? await db
        .prepare(
          `SELECT (SELECT COUNT(*) FROM producto WHERE publicado = 1) AS publicados,
                  (SELECT COUNT(*) FROM pedido WHERE date(fecha) = date('now')) AS pedidos_hoy`,
        )
        .first<{ publicados: number; pedidos_hoy: number }>()
    : null;

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Mi tienda</h1>

      {guardado && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          Cambios guardados. Ya se ven en la tienda.
        </p>
      )}

      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-verde-suave text-lg">
          🌐
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold">proinshop.com</p>
          <p className="text-[11.5px] text-gris">
            {cifras?.publicados ?? 0} productos publicados · {cifras?.pedidos_hoy ?? 0} pedido(s) hoy
          </p>
        </div>
        <a
          href="https://proinshop.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11.5px] font-bold text-rojo hover:underline"
        >
          Ver ↗
        </a>
      </div>

      <form action={guardarTienda} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-extrabold">Datos del negocio</h2>
        <div className="space-y-2.5">
          <div>
            <label htmlFor="nombre" className="mb-1.5 block text-[12.5px] font-bold text-gris">
              Nombre del negocio
            </label>
            <input id="nombre" name="nombre" defaultValue={negocio.nombre} className={CAMPO} />
          </div>

          <div>
            <label htmlFor="whatsapp" className="mb-1.5 block text-[12.5px] font-bold text-gris">
              WhatsApp de ventas
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              defaultValue={negocio.whatsapp}
              inputMode="tel"
              placeholder="Solo números, con el código del país"
              className={CAMPO}
            />
            <p className="mt-1.5 text-[11.5px] text-gris2">
              Sin este número, los botones verdes de la tienda abren WhatsApp sin destinatario.
            </p>
          </div>

          <div>
            <label htmlFor="correo" className="mb-1.5 block text-[12.5px] font-bold text-gris">
              Correo de contacto
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              defaultValue={negocio.correo}
              placeholder="correo@ejemplo.com"
              className={CAMPO}
            />
          </div>

          <div>
            <label htmlFor="direccion" className="mb-1.5 block text-[12.5px] font-bold text-gris">
              Dirección del local
            </label>
            <input
              id="direccion"
              name="direccion"
              defaultValue={negocio.direccion}
              placeholder="Dirección"
              className={CAMPO}
            />
          </div>

          <div>
            <label htmlFor="costo_envio" className="mb-1.5 block text-[12.5px] font-bold text-gris">
              Costo del envío a domicilio
            </label>
            <input
              id="costo_envio"
              name="costo_envio"
              inputMode="decimal"
              defaultValue={negocio.costoEnvio}
              className={CAMPO}
            />
          </div>
        </div>

        <h2 className="mb-2 mt-5 text-[13px] font-extrabold">Cómo se ve la tienda</h2>
        <label className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-linea p-3.5">
          <span className="flex-1">
            <span className="block text-[13px] font-extrabold">Mostrar existencias al público</span>
            <span className="block text-[11px] text-gris">&quot;3 disponibles&quot; en la ficha</span>
          </span>
          <input
            type="checkbox"
            name="mostrar_stock"
            defaultChecked={negocio.mostrarStock}
            className="h-5 w-5 accent-rojo"
          />
        </label>
        <label className="flex items-center gap-3 rounded-xl border-[1.5px] border-linea p-3.5">
          <span className="flex-1">
            <span className="block text-[13px] font-extrabold">Ocultar productos sin stock</span>
            <span className="block text-[11px] text-gris">No aparecen en la tienda</span>
          </span>
          <input
            type="checkbox"
            name="ocultar_agotados"
            defaultChecked={negocio.ocultarAgotados}
            className="h-5 w-5 accent-rojo"
          />
        </label>

        <button
          type="submit"
          className="mt-4 w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
        >
          Guardar cambios
        </button>
      </form>
    </>
  );
}
