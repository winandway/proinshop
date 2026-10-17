"use client";

import { borrarBorradoresDe } from "@/componentes/GuardaBorrador";

/**
 * Salir de verdad: además de cerrar la sesión en el servidor, borra los
 * borradores de esta cuenta. En una computadora compartida, el siguiente no
 * ve lo que el anterior dejó escrito.
 */
export function BotonSalir({ salir, dueno }: { salir: () => Promise<void>; dueno: string }) {
  return (
    <form action={salir} onSubmit={() => borrarBorradoresDe(dueno)} className="ml-auto">
      <button
        type="submit"
        className="rounded-xl bg-white/20 px-3.5 py-2 text-[12px] font-bold transition hover:bg-white/30"
      >
        Salir
      </button>
    </form>
  );
}
