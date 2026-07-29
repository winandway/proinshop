import { redirect } from "next/navigation";
import { BarraInferior, MenuLateral } from "@/componentes/panel/BarraInferior";
import { NOMBRE_ROL, usuarioActual } from "@/lib/sesion";
import { salir } from "../acciones";

/**
 * Marco del panel. Toda ruta que cuelgue de aquí exige sesión: la comprobación
 * vive en el layout, no en cada página, para que no se pueda olvidar en una.
 */
export default async function DisenoPanel({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");

  return (
    <div className="min-h-screen bg-crema pb-[74px] md:pb-0">
      <header className="bg-rojo px-4 py-3 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-base"
          >
            👤
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-extrabold leading-tight">{usuario.nombre}</p>
            <p className="text-[11.5px] text-white/80">{NOMBRE_ROL[usuario.rol]}</p>
          </div>

          <form action={salir} className="ml-auto">
            <button
              type="submit"
              className="rounded-xl bg-white/20 px-3.5 py-2 text-[12px] font-bold transition hover:bg-white/30"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl">
        <MenuLateral esDueno={usuario.rol === "dueno"} />
        <main className="min-w-0 flex-1 p-4">{children}</main>
      </div>

      <BarraInferior esDueno={usuario.rol === "dueno"} />
    </div>
  );
}
