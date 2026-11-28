import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#141726",
          backgroundImage:
            "radial-gradient(circle at 88% 12%, rgba(79, 107, 246, 0.34), transparent 48%), radial-gradient(circle at 12% 88%, rgba(224, 159, 62, 0.22), transparent 50%), linear-gradient(155deg, #1B2038 0%, #141724 55%, #1D1B2C 100%)",
          fontFamily: "sans-serif",
          color: "#FFFFFF",
          position: "relative",
        }}
      >
        {/* Subtle Gold Double Ring Emblem */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 196,
            height: 196,
            borderRadius: 56,
            background: "rgba(255, 255, 255, 0.05)",
            border: "2px solid rgba(224, 159, 62, 0.35)",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4)",
            marginBottom: 44,
          }}
        >
          <svg
            width="116"
            height="116"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="25"
              cy="34"
              r="14"
              stroke="#E09F3E"
              strokeWidth="3.2"
            />
            <circle
              cx="39"
              cy="34"
              r="14"
              stroke="#7A94FF"
              strokeWidth="3.2"
            />
            <path
              d="M32 14L35.2 20L32 23.5L28.8 20L32 14Z"
              fill="#F6D38C"
            />
          </svg>
        </div>

        {/* Brand Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#FFFFFF",
          }}
        >
          Nikah
          <span style={{ color: "#E09F3E" }}>Plan</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 30,
            color: "rgba(255, 255, 255, 0.72)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          From &ldquo;I Do&rdquo; to Honeymoon
        </div>

        {/* Bottom Fine Gold Line */}
        <div
          style={{
            position: "absolute",
            bottom: 140,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 120,
              height: 4,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(79,107,246,0.2) 0%, #E09F3E 50%, rgba(79,107,246,0.2) 100%)",
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: "rgba(255, 255, 255, 0.45)",
              letterSpacing: "0.04em",
            }}
          >
            Wedding &amp; Honeymoon Budget Planner
          </div>
        </div>
      </div>
    ),
    {
      width: 1170,
      height: 2532,
    }
  );
}
