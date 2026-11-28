import { ImageResponse } from "next/og";

export const alt = "NikahPlan — Wedding & Honeymoon Budget Planner";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(135deg, #121520 0%, #181C2E 52%, #22294A 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Soft Accent Glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "520px",
            height: "520px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(79,107,246,0.34) 0%, rgba(79,107,246,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-140px",
            left: "-60px",
            width: "440px",
            height: "440px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(224,159,62,0.22) 0%, rgba(224,159,62,0) 70%)",
            display: "flex",
          }}
        />

        {/* Top Brand Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="25"
                  cy="34"
                  r="13"
                  stroke="#FFFFFF"
                  strokeWidth="4.2"
                />
                <circle
                  cx="39"
                  cy="34"
                  r="13"
                  stroke="#4F6BF6"
                  strokeWidth="4.2"
                />
                <circle cx="32" cy="18" r="3.5" fill="#E09F3E" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                NikahPlan
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                From &ldquo;I Do&rdquo; to Honeymoon
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: "9999px",
              border: "1px solid rgba(224,159,62,0.45)",
              background: "rgba(224,159,62,0.14)",
              padding: "10px 22px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#F8D28C",
            }}
          >
            1× Bayar untuk 2 Akun Pasangan
          </div>
        </div>

        {/* Center Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "58px",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Atur Budget Nikah &amp; Bulan Madu</span>
            <span style={{ color: "#93A8FF" }}>
              Tanpa Drama Bersama Pasangan
            </span>
          </div>
          <div
            style={{
              fontSize: "23px",
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.78)",
              maxWidth: "860px",
            }}
          >
            Catat vendor, jadwal DP, dana dua keluarga, undangan online 8 tema,
            rekap angpao, hingga dompet honeymoon multi-mata uang dalam satu
            aplikasi offline-ready.
          </div>
        </div>

        {/* Bottom Feature Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            zIndex: 1,
          }}
        >
          {[
            "Split Dana Keluarga",
            "Undangan Online + RSVP",
            "Dompet Honeymoon",
            "Export PDF & Excel",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: "16px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
