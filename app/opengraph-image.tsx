import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -1 }}>
        Postmen
      </div>
      <div style={{ fontSize: 28, marginTop: 16, opacity: 0.9 }}>
        Modern API testing platform
      </div>
    </div>,
    size,
  );
}
