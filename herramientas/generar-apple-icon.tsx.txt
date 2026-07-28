import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconoApple() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#FF2D2D" strokeWidth="10" />
          <circle cx="50" cy="50" r="29" fill="none" stroke="#FF2D2D" strokeWidth="8.5" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="#FF2D2D" strokeWidth="7" />
          <circle cx="50" cy="50" r="5.5" fill="#FF2D2D" />
        </svg>
      </div>
    ),
    size,
  );
}
