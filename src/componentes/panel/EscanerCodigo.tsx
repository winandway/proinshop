"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Escáner de códigos de barras con la cámara del celular.
 *
 * Usa el lector que trae el navegador (Chrome en Android) y, donde no existe
 * (iPhone), uno que se carga solo en el momento de escanear. Lee los códigos
 * de los productos (EAN-13, UPC-A, Code 128 y los demás comunes) y avisa cada
 * lectura; el mismo código no se repite por 1,5 segundos para no sumar el
 * producto dos veces sin querer.
 *
 * Un lector de mano USB o Bluetooth no necesita esto: escribe el código en el
 * buscador como si fuera un teclado, y Vender lo reconoce al dar Enter.
 */

type Detector = { detect: (fuente: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

const FORMATOS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code", "itf"];

async function crearDetector(): Promise<Detector> {
  const nativo = (globalThis as unknown as { BarcodeDetector?: new (opciones: object) => Detector })
    .BarcodeDetector;
  if (nativo) return new nativo({ formats: FORMATOS });
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: FORMATOS as never }) as unknown as Detector;
}

export function EscanerCodigo({
  alLeer,
  alCerrar,
}: {
  alLeer: (codigo: string) => void;
  alCerrar: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const ultimo = useRef<{ codigo: string; cuando: number } | null>(null);
  const avisar = useRef(alLeer);

  useEffect(() => {
    avisar.current = alLeer;
  }, [alLeer]);

  useEffect(() => {
    let activo = true;
    let flujo: MediaStream | null = null;
    let espera: number | undefined;

    (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!activo || !video.current) return;
        video.current.srcObject = flujo;
        await video.current.play();
        const detector = await crearDetector();

        const mirar = async () => {
          if (!activo || !video.current) return;
          try {
            const encontrados = await detector.detect(video.current);
            const codigo = encontrados[0]?.rawValue?.trim();
            const ahora = performance.now();
            if (
              codigo &&
              !(ultimo.current?.codigo === codigo && ahora - ultimo.current.cuando < 1500)
            ) {
              ultimo.current = { codigo, cuando: ahora };
              navigator.vibrate?.(60);
              avisar.current(codigo);
            }
          } catch {
            // Un cuadro que no se pudo leer no es un error: se prueba el siguiente.
          }
          espera = window.setTimeout(mirar, 180);
        };
        mirar();
      } catch (error) {
        const nombre = (error as { name?: string })?.name;
        setProblema(
          nombre === "NotAllowedError"
            ? "El navegador no dio permiso para usar la cámara. Actívalo en los ajustes del sitio y vuelve a intentar."
            : "No se pudo abrir la cámara. Puedes escribir el código en el buscador o usar un lector.",
        );
      }
    })();

    return () => {
      activo = false;
      window.clearTimeout(espera);
      flujo?.getTracks().forEach((pista) => pista.stop());
    };
  }, []);

  return (
    <div className="mb-3 overflow-hidden rounded-2xl bg-tinta text-white">
      <div className="relative aspect-[4/3] w-full">
        <video ref={video} muted playsInline className="h-full w-full object-cover" />
        {/* Guía de dónde poner el código. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[12%] top-1/2 h-[30%] -translate-y-1/2 rounded-xl border-2 border-white/80"
        />
        {problema && (
          <p className="absolute inset-0 grid place-items-center bg-tinta/90 p-6 text-center text-[13px]">
            {problema}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="flex-1 text-[12px] text-white/80">
          Apunta al código de barras. Cada lectura suma el producto.
        </p>
        <button
          type="button"
          onClick={alCerrar}
          className="rounded-xl bg-white px-4 py-2 text-[12.5px] font-extrabold text-tinta"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
