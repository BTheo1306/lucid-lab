import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

import { getPostBySlug } from "@/lib/blog/posts";
import { CATEGORIES } from "@/lib/blog/types";

export const alt = "Lucid-Lab — Article de blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    const logoBuffer = readFileSync(join(process.cwd(), "public", "logo.png"));
    const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#F7F5F1", fontFamily: "system-ui, sans-serif" }}>
          <img src={logoSrc} style={{ width: 48, height: 48, marginBottom: 24 }} />
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0A0A0A" }}>Lucid-Lab</span>
          <span style={{ fontSize: 16, color: "#666", marginTop: 8 }}>Blog</span>
        </div>
      ),
      size,
    );
  }

  const logoBuffer = readFileSync(join(process.cwd(), "public", "logo.png"));
  const robotBuffer = readFileSync(join(process.cwd(), "public", "robot-poster.png"));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  const robotSrc = `data:image/png;base64,${robotBuffer.toString("base64")}`;
  const category = CATEGORIES[post.frontmatter.category];

  // Truncate long titles so the OG card stays readable
  const title = post.frontmatter.title.length > 95
    ? post.frontmatter.title.slice(0, 92).trimEnd() + "…"
    : post.frontmatter.title;

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
        {/* Hero radial gradient — same as homepage OG */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(84.42% 84.32% at 51.63% 100%, #FFB451 0%, #EFC680 24.76%, #B4D8FF 47.6%, #D2E8FF 75%, #FAFDFF 100%)",
          }}
        />

        {/* LEFT — article copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 32px 60px 72px",
            width: "640px",
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
            }}
          >
            <img
              src={logoSrc}
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0A0A0A",
                letterSpacing: "-0.01em",
              }}
            >
              Lucid-Lab
            </span>
            <span
              style={{
                marginLeft: "8px",
                fontSize: "13px",
                color: "#666",
                fontWeight: 500,
              }}
            >
              · Blog
            </span>
          </div>

          {/* Headline block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Category pill */}
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "rgba(0,0,0,0.08)",
                color: "#0A0A0A",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              {category.title}
            </div>

            {/* Title */}
            <div
              style={{
                display: "flex",
                fontSize: title.length > 60 ? "44px" : "52px",
                fontWeight: 800,
                color: "#0A0A0A",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                marginBottom: "24px",
              }}
            >
              {title}
            </div>

            {/* Author + reading time */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "16px",
                color: "#444",
                fontWeight: 500,
              }}
            >
              <span>Théo · CTO Lucid-Lab</span>
              <span style={{ color: "#999" }}>·</span>
              <span>{post.readingTimeMinutes} min de lecture</span>
            </div>
          </div>

          {/* Domain */}
          <div
            style={{
              fontSize: "13px",
              color: "#888",
            }}
          >
            lucid-lab.fr/blog
          </div>
        </div>

        {/* RIGHT — robot poster */}
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
    size,
  );
}
