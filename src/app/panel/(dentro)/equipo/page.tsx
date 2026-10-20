import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BotonCopiar } from "@/componentes/panel/BotonCopiar";
import { BotonRecuperacion } from "@/componentes/panel/BotonRecuperacion";
import { FormularioInvitar } from "@/componentes/panel/FormularioInvitar";
import { baseDeDatos } from "@/lib/d1";
import { NEGOCIO } from "@/lib/config";
import { NOMBRE_ROL, usuarioActual, type Rol } from "@/lib/sesion";
import { MODULOS, leerPermisos, puedeUsar } from "@/lib/permisos";
import { anularInvitacion, cambiarActivo, cambiarRol, guardarPermisos } from "./acciones";

export const metadata: Metadata = { title: "Equipo", robots: { index: false } };

export default async function Equipo() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");
  if (usuario.rol !== "dueno") redirect("/panel");

  const db = await baseDeDatos();

  const personas = db
    ? (
        await db
          .prepare(
            `SELECT id, nombre, correo, rol, activo, ultimo_acceso, permisos
             FROM usuario WHERE negocio_id = ? ORDER BY id`,
          )
          .bind(usuario.negocioId)
          .all<{
            id: number;
            nombre: string;
            correo: string | null;
            rol: string;
            activo: number;
            ultimo_acceso: string | null;
            permisos: string | null;
          }>()
      ).results
    : [];

  const pendientes = db
    ? (
        await db
          .prepare(
            `SELECT codigo, nombre, rol, expira FROM invitacion
             WHERE negocio_id = ? AND usada = 0 AND expira > datetime('now')
             ORDER BY creada_en DESC`,
          )
          .bind(usuario.negocioId)
          .all<{ codigo: string; nombre: string | null; rol: string; expira: string }>()
      ).results
    : [];

  return (
    <>
      <h1 className="mb-1 text-xl font-black tracking-tight">Equipo y permisos</h1>
      <p className="mb-4 text-[12.5px] text-gris">
        Cada rol trae sus permisos. Toca «Rol y permisos» en una persona para darle o quitarle módulos.
      </p>

      <div className="mb-4 space-y-2.5">
        {personas.map((persona) => (
          <div
            key={persona.id}
            className="flex flex-wrap items-start gap-3 rounded-2xl border border-linea bg-white p-3.5"
          >
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crema text-lg"
            >
              👤
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-extrabold">
                {persona.nombre}
                {persona.id === usuario.id && (
                  <span className="ml-1.5 text-[11px] font-bold text-gris">(tú)</span>
                )}
              </p>
              <p className="truncate text-[11.5px] text-gris">{persona.correo}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-crema px-2 py-0.5 text-[10.5px] font-bold text-gris">
                  {NOMBRE_ROL[persona.rol as Rol] ?? persona.rol}
                </span>
                {persona.activo === 1 ? (
                  <span className="rounded-md bg-verde-suave px-2 py-0.5 text-[10.5px] font-bold text-verde">
                    Activo
                  </span>
                ) : (
                  <span className="rounded-md bg-rojo-suave px-2 py-0.5 text-[10.5px] font-bold text-rojo-oscuro">
                    Desactivado
                  </span>
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {persona.id !== usuario.id && (
                <form action={cambiarActivo}>
                  <input type="hidden" name="id" value={persona.id} />
                  <button
                    type="submit"
                    className="rounded-lg border-[1.5px] border-linea px-3 py-2 text-[11.5px] font-bold text-gris transition hover:border-gris2"
                  >
                    {persona.activo === 1 ? "Desactivar" : "Activar"}
                  </button>
                </form>
              )}
              <BotonRecuperacion
                usuarioId={persona.id}
                nombre={persona.nombre}
                dominio={NEGOCIO.url}
              />
            </div>
            {persona.id !== usuario.id && (
              <details className="basis-full rounded-xl bg-crema px-3 py-2">
                <summary className="cursor-pointer text-[12px] font-extrabold">Rol y permisos</summary>
                <form action={cambiarRol} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={persona.id} />
                  <select
                    name="rol"
                    defaultValue={persona.rol}
                    aria-label="Rol"
                    className="flex-1 rounded-lg border-[1.5px] border-linea bg-white px-2 py-1.5 text-[12px] font-bold outline-none"
                  >
                    <option value="dueno">Propietario (todo)</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="bodega">Bodega</option>
                  </select>
                  <button type="submit" className="rounded-lg bg-tinta px-3 py-1.5 text-[11.5px] font-bold text-white">
                    Cambiar rol
                  </button>
                </form>
                {persona.rol !== "dueno" && (
                  <form action={guardarPermisos} className="mt-3">
                    <input type="hidden" name="id" value={persona.id} />
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {MODULOS.map((modulo) => (
                        <li key={modulo.clave}>
                          <label className="flex items-center gap-2 text-[12px] font-semibold">
                            <input
                              type="checkbox"
                              name={`permiso_${modulo.clave}`}
                              defaultChecked={puedeUsar(
                                { rol: persona.rol as Rol, permisos: leerPermisos(persona.permisos) },
                                modulo.clave,
                              )}
                              className="h-4 w-4 accent-verde"
                            />
                            {modulo.texto}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="submit"
                      className="mt-2.5 w-full rounded-lg bg-tinta py-2 text-[12px] font-bold text-white"
                    >
                      Guardar permisos
                    </button>
                  </form>
                )}
              </details>
            )}
          </div>
        ))}
      </div>

      {pendientes.length > 0 && (
        <div className="mb-4 rounded-2xl border border-linea bg-white p-4">
          <h2 className="mb-3 text-[13px] font-extrabold">Invitaciones sin usar</h2>
          <ul className="space-y-3">
            {pendientes.map((invitacion) => {
              const enlace = `${NEGOCIO.url}/panel/invitacion?codigo=${invitacion.codigo}`;
              return (
                <li
                  key={invitacion.codigo}
                  className="border-b border-linea pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-[12.5px] font-bold">
                    {invitacion.nombre ?? "Sin nombre"} ·{" "}
                    {NOMBRE_ROL[invitacion.rol as Rol] ?? invitacion.rol}
                  </p>
                  <p className="mt-1 break-all rounded-lg bg-crema px-2.5 py-2 font-mono text-[10.5px] text-gris">
                    {enlace}
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <BotonCopiar
                      texto={enlace}
                      etiqueta="Copiar enlace"
                      className="rounded-lg bg-tinta px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:opacity-90"
                    />
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Entra al panel de Proinshop con este enlace: ${enlace}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11.5px] font-bold text-verde transition hover:underline"
                    >
                      Enviar por WhatsApp
                    </a>
                    <form action={anularInvitacion} className="ml-auto">
                      <input type="hidden" name="codigo" value={invitacion.codigo} />
                      <button
                        type="submit"
                        className="text-[11.5px] font-bold text-gris transition hover:text-rojo"
                      >
                        Anular
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <FormularioInvitar dominio={NEGOCIO.url} />
    </>
  );
}
