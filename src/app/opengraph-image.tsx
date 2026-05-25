import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"

export const alt = "Lucid-Lab : transformez vos opportunités IA en systèmes métier fiables."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const logoBuffer = readFileSync(join(process.cwd(), "public", "logo.png"))
  const robotBuffer = readFileSync(join(process.cwd(), "public", "robot-poster.png"))
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`
  const robotSrc = `data:image/png;base64,${robotBuffer.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#F7F5F1",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Premium light/data backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, #f8f7f3 0%, #ffffff 42%, #eaf2f5 100%)",
          }}
        />

        {/* LEFT — layout from OG preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 32px 60px 72px",
            width: "560px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* Logo + wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "44px",
            }}
          >
            <img
              src={logoSrc}
              alt="Lucid-Lab"
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#0A0A0A",
                letterSpacing: "-0.01em",
              }}
            >
              Lucid-Lab
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "44px",
              fontWeight: "800",
              color: "#0A0A0A",
              lineHeight: "1.05",
              letterSpacing: "-0.03em",
              marginBottom: "20px",
            }}
          >
            <span>Opportunités IA.</span>
            <span>Systèmes métier</span>
            <span>fiables.</span>
          </div>

          {/* Subtext */}
          <div
            style={{
              fontSize: "17px",
              fontWeight: "400",
              color: "#444",
              lineHeight: "1.6",
              marginBottom: "36px",
              maxWidth: "420px",
            }}
          >
            Audit, roadmap, agents IA, outils internes, monitoring et documentation.
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap" }}>
            <div
              style={{
                background: "#0A0A0A",
                color: "#fff",
                padding: "9px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Audit IA
            </div>
            <div
              style={{
                background: "rgba(0,0,0,0.08)",
                color: "#1A1A1A",
                padding: "9px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Build · Run · Documentation
            </div>
          </div>

          {/* Domain */}
          <div
            style={{
              marginTop: "44px",
              fontSize: "13px",
              color: "#888",
            }}
          >
            lucid-lab.fr
          </div>
        </div>

        {/* RIGHT — robot-poster.png, same style as hero section */}
        <div
          style={{
            display: "flex",
            flex: "1 1 0",
            height: "630px",
            position: "relative",
          }}
        >
          <img
            src={robotSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
