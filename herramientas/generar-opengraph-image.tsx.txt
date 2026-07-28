import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Imagen que se ve al compartir el sitio por WhatsApp, Facebook o X. */
export const alt = "Proinshop — Importación directa desde China";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ImagenSocial() {
  // Geist en negra y regular: sin cargarlas, el generador dibuja todo con el
  // mismo grosor y el logotipo pierde la fuerza de la marca.
  const [negra, regular] = await Promise.all([
    readFile(join(process.cwd(), "src/fuentes/Geist-Black.ttf")),
    readFile(join(process.cwd(), "src/fuentes/Geist-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#ffffff",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 640,
            height: 640,
            borderRadius: 320,
            background: "#FFF0F0",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <svg width="118" height="118" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#FF2D2D" strokeWidth="10" />
            <circle cx="50" cy="50" r="29" fill="none" stroke="#FF2D2D" strokeWidth="8.5" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="#FF2D2D" strokeWidth="7" />
            <circle cx="50" cy="50" r="5.5" fill="#FF2D2D" />
          </svg>
          <span style={{ fontSize: 86, fontWeight: 900, color: "#14161A", letterSpacing: -3 }}>
            PROINSHOP
          </span>
        </div>

        <span
          style={{
            marginTop: 36,
            fontSize: 42,
            fontWeight: 900,
            color: "#14161A",
            letterSpacing: -1.4,
          }}
        >
          Importación directa desde China
        </span>
        <span style={{ marginTop: 16, fontSize: 27, color: "#6E7480" }}>
          Plantas eléctricas · Motos · Bicicletas · Herramientas · Repuestos
        </span>

        <div
          style={{
            marginTop: 42,
            display: "flex",
            alignItems: "center",
            background: "#FF2D2D",
            color: "#ffffff",
            fontSize: 25,
            fontWeight: 900,
            padding: "18px 40px",
            borderRadius: 999,
            alignSelf: "flex-start",
          }}
        >
          proinshop.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: negra, weight: 900, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
