"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Envía el formulario sin que React lo vacíe.
 *
 * Con `<form action={...}>`, React borra todos los campos al terminar cada
 * envío, aunque el servidor haya respondido «falta el precio». El dueño
 * perdía la ficha entera por un dato. Así se envía igual, pero lo escrito se
 * queda en su sitio hasta que el guardado sale bien.
 */
export function enviarSinBorrar(enviar: (datos: FormData) => void) {
  return (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const boton = (evento.nativeEvent as SubmitEvent).submitter;

    let datos: FormData;
    try {
      // Incluye el botón que se tocó, si tiene nombre y valor.
      datos = new FormData(formulario, boton);
    } catch {
      datos = new FormData(formulario);
    }

    startTransition(() => enviar(datos));
  };
}
