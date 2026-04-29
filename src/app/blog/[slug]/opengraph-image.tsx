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
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  const category = CATEGORIES[post.frontmatter.category];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F7F5F1",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(84% 84% at 51% 100%, #FFB451 0%, #EFC680 24%, #B4D8FF 48%, #D2E8FF 75%, #FAFDFF 100%)",
            opacity: 0.5,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            position: "relative",
          }}
        >
          <img src={logoSrc} style={{ width: 32, height: 32 }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#0A0A0A" }}>
            Lucid-Lab
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            flex: 1,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 18,
            }}
          >
            {category.title}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#0A0A0A",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
            }}
          >
            {post.frontmatter.title}
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 20,
              color: "#333",
              fontWeight: 500,
            }}
          >
            Théo · CTO Lucid-Lab · {post.readingTimeMinutes} min de lecture
          </div>
        </div>
      </div>
    ),
    size,
  );
}
