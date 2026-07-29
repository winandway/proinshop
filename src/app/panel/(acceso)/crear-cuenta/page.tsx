import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FormularioAcceso } from "@/componentes/panel/FormularioAcceso";
import { crearCuenta } from "../../acciones";
import { hayUsuarios, usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default async function CrearCuenta() {
  if (await usuarioActual()) redirect("/panel");

  // El alta abierta existe una sola vez: la del propietario. Después, las
  // cuentas se crean por invitación desde dentro del panel.
  if (await hayUsuarios()) redirect("/panel/entrar");

  return (
    <>
      <span className="mb-3 inline-block rounded-md bg-rojo px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wide text-white">
        Primera cuenta
      </span>
      <h1 className="text-xl font-black tracking-tight">Crea tu cuenta de propietario</h1>
      <p className="mb-6 mt-1.5 text-[13px] text-gris">
        Es la cuenta con todos los permisos. Desde ella podrás invitar a tus
        empleados.
      </p>

      <FormularioAcceso
        accion={crearCuenta}
        boton="Crear mi cuenta"
        botonEnviando="Creando…"
        campos={[
          { nombre: "nombre", etiqueta: "Tu nombre", marcador: "Nombre y apellido" },
          {
            nombre: "correo",
            etiqueta: "Correo electrónico",
            tipo: "email",
            marcador: "correo@ejemplo.com",
          },
          {
            nombre: "contrasena",
            etiqueta: "Contraseña",
            tipo: "password",
            ayuda: "Mínimo 8 caracteres, con letras y números.",
          },
          { nombre: "repetida", etiqueta: "Repite la contraseña", tipo: "password" },
        ]}
      />

      <p className="mt-6 text-center text-[12.5px] text-gris">
        ¿Ya tienes cuenta?{" "}
        <Link href="/panel/entrar" className="font-bold text-rojo hover:underline">
          Entra aquí
        </Link>
      </p>
    </>
  );
}
