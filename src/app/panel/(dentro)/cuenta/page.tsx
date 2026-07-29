import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FormularioContrasena } from "@/componentes/panel/FormularioContrasena";
import { baseDeDatos } from "@/lib/d1";
import { NOMBRE_ROL, usuarioActual } from "@/lib/sesion";
import { cerrarOtrasSesiones } from "./acciones";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function Cuenta() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");

  const db = await baseDeDatos();
  const sesiones = db
    ? await db
        .prepare("SELECT COUNT(*) AS total FROM sesion WHERE usuario_id = ?")
        .bind(usuario.id)
        .first<{ total: number }>()
    : null;

  const otras = Math.max(0, (sesiones?.total ?? 1) - 1);

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Mi cuenta</h1>

      <div className="mb-3 rounded-2xl border border-linea bg-white p-4">
        <dl className="space-y-2.5 text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-gris">Nombre</dt>
            <dd className="font-bold">{usuario.nombre}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gris">Correo</dt>
            <dd className="truncate font-bold">{usuario.correo}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gris">Permisos</dt>
            <dd className="font-bold">{NOMBRE_ROL[usuario.rol]}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-3 rounded-2xl border border-linea bg-white p-4">
        <h2 className="mb-3 text-[13px] font-extrabold">Cambiar contraseña</h2>
        <FormularioContrasena />
      </div>

      <div className="rounded-2xl border border-linea bg-white p-4">
        <h2 className="text-[13px] font-extrabold">Sesiones abiertas</h2>
        <p className="mt-1 text-[12.5px] text-gris">
          {otras === 0
            ? "Solo estás dentro en este dispositivo."
            : `Además de este dispositivo, hay ${otras} sesión(es) abierta(s).`}
        </p>
        {otras > 0 && (
          <form action={cerrarOtrasSesiones}>
            <button
              type="submit"
              className="mt-3 rounded-xl border-[1.5px] border-linea px-4 py-2.5 text-[12.5px] font-bold transition hover:border-gris2"
            >
              Cerrar las otras sesiones
            </button>
          </form>
        )}
      </div>
    </>
  );
}
