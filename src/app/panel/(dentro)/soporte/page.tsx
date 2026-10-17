import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { esCuentaDeSoporte } from "@/lib/contrasenas";
import { franjaActiva, guardarFranja } from "@/lib/franja";
import { usuarioActual } from "@/lib/sesion";
import { GuardaBorrador, LimpiarBorrador } from "@/componentes/GuardaBorrador";

export const metadata: Metadata = { title: "Soporte", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-4 py-3 text-[13.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

/** Solo nuestras cuentas: el dueño del negocio no ve esta pantalla. */
async function soporteActual() {
  const usuario = await usuarioActual();
  if (!usuario || !esCuentaDeSoporte(usuario.nombre, usuario.correo)) return null;
  return usuario;
}

async function guardar(datos: FormData) {
  "use server";

  if (!(await soporteActual())) return;

  const trabajo = String(datos.get("trabajo") ?? "").trim().slice(0, 300);
  const estado = datos.get("estado") === "terminado" ? "terminado" : "en_proceso";
  const activa = datos.get("activa") === "on";
  if (activa && trabajo.length < 3) return;

  await guardarFranja({ trabajo, estado, activa });

  revalidatePath("/panel", "layout");
  redirect("/panel/soporte?guardado=1");
}

export default async function Soporte({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  if (!(await soporteActual())) redirect("/panel");

  const { guardado } = await searchParams;
  const franja = await franjaActiva();

  return (
    <>
      <h1 className="mb-1 text-xl font-black tracking-tight">Soporte</h1>
      <p className="mb-4 text-[12.5px] text-gris">
        Solo la ven las cuentas de soporte. El propietario no tiene acceso.
      </p>

      {guardado && <LimpiarBorrador claves={["franja"]} />}
      {guardado && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          Franja actualizada.
        </p>
      )}

      <form action={guardar} className="rounded-2xl bg-white p-4 shadow-sm">
        <GuardaBorrador clave="franja" />
        <h2 className="mb-1 text-[13px] font-extrabold">Franja de estado del trabajo</h2>
        <p className="mb-3 text-[11.5px] leading-snug text-gris">
          Pasa a «terminado» solo cuando quien paga el trabajo ya lo probó y lo autoriza. Al
          apagarla queda guardada en el historial.
        </p>

        <label htmlFor="trabajo" className="mb-1.5 block text-[12.5px] font-bold text-gris">
          En qué estamos trabajando
        </label>
        <textarea
          id="trabajo"
          name="trabajo"
          rows={3}
          defaultValue={franja?.trabajo ?? ""}
          placeholder="Lo que se está construyendo, en palabras del cliente"
          className={`${CAMPO} resize-y`}
        />

        <fieldset className="mt-3 space-y-2">
          <legend className="mb-1.5 text-[12.5px] font-bold text-gris">Estado</legend>
          <label className="flex items-center gap-3 rounded-xl border-[1.5px] border-linea p-3">
            <input
              type="radio"
              name="estado"
              value="en_proceso"
              defaultChecked={franja?.estado !== "terminado"}
              className="h-4 w-4 accent-tinta"
            />
            <span className="text-[13px] font-bold">En proceso</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border-[1.5px] border-linea p-3">
            <input
              type="radio"
              name="estado"
              value="terminado"
              defaultChecked={franja?.estado === "terminado"}
              className="h-4 w-4 accent-verde"
            />
            <span className="text-[13px] font-bold">Terminado, le toca probar</span>
          </label>
        </fieldset>

        <label className="mt-3 flex items-center gap-3 rounded-xl border-[1.5px] border-linea p-3">
          <span className="flex-1 text-[13px] font-bold">Mostrar la franja</span>
          <input
            type="checkbox"
            name="activa"
            defaultChecked={Boolean(franja)}
            className="h-5 w-5 accent-rojo"
          />
        </label>

        <button
          type="submit"
          className="mt-4 w-full rounded-2xl bg-tinta py-3.5 text-sm font-extrabold text-white transition hover:opacity-90"
        >
          Guardar
        </button>
      </form>
    </>
  );
}
