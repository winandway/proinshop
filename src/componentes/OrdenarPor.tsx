"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPCIONES = ["recientes", "precio-asc", "precio-desc"] as const;
export type Orden = (typeof OPCIONES)[number];

export function OrdenarPor({
  actual,
  etiquetas,
}: {
  actual: Orden;
  etiquetas: Record<Orden, string>;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();

  function cambiar(orden: Orden) {
    const nuevos = new URLSearchParams(parametros.toString());
    if (orden === "recientes") nuevos.delete("orden");
    else nuevos.set("orden", orden);
    const cadena = nuevos.toString();
    router.push(cadena ? `${ruta}?${cadena}` : ruta);
  }

  return (
    <div className="sin-barra flex gap-2 overflow-x-auto">
      {OPCIONES.map((opcion) => (
        <button
          key={opcion}
          type="button"
          onClick={() => cambiar(opcion)}
          aria-pressed={opcion === actual}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
            opcion === actual
              ? "border-tinta bg-tinta text-white"
              : "border-linea bg-white text-gris hover:border-gris2"
          }`}
        >
          {etiquetas[opcion]}
        </button>
      ))}
    </div>
  );
}
