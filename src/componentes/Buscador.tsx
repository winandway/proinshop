"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function Buscador({ marcador }: { marcador: string }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [valor, setValor] = useState(parametros.get("q") ?? "");

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const limpio = valor.trim();
    router.push(limpio ? `/catalogo?q=${encodeURIComponent(limpio)}` : "/catalogo");
  }

  return (
    <form onSubmit={enviar} className="w-full md:max-w-sm" role="search">
      <div className="flex items-center gap-2 rounded-xl bg-crema px-4 py-2.5">
        <span aria-hidden="true" className="text-sm">
          🔍
        </span>
        <input
          type="search"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          placeholder={marcador}
          aria-label={marcador}
          className="w-full bg-transparent text-sm text-tinta outline-none placeholder:text-gris2"
        />
      </div>
    </form>
  );
}
