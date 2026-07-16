import type { NextConfig } from "next";

// CSP volontairement en Report-Only pour cette première passe. Le site charge
// des scripts inline (hydratation Next), du WebAssembly (Spline) et des tiers
// (TidyCal, Google Analytics après consentement). On observe les rapports avant
// de basculer en enforce, sinon le risque de casser le rendu est réel.
// Passage en enforce = renommer l'en-tête en "Content-Security-Policy".
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  // 'unsafe-inline' reste requis tant que la CSP n'est pas passée à nonce
  // (scripts d'hydratation Next). 'wasm-unsafe-eval' est requis par Spline.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://storage.efferd.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://prod.spline.design https://storage.efferd.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://tidycal.com https://www.tidycal.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    // `preload` n'engage rien tant que le domaine n'est pas soumis à
    // hstspreload.org : c'est une démarche volontaire et distincte.
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // SAMEORIGIN plutôt que DENY : le sous-domaine de signature DocuSeal peut
  // être embarqué. À durcir en DENY une fois ce point confirmé.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // allow-popups : ne pas casser un éventuel flux OAuth en popup (SSO admin).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Corrige le `Cache-Control: max-age=0` observé sur /_next/image.
    minimumCacheTTL: 31536000,
    remotePatterns: [{ protocol: "https", hostname: "storage.efferd.com" }],
  },
  allowedDevOrigins: [
    "client.localhost",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.trycloudflare.com",
  ],
  async rewrites() {
    return [
      {
        source: "/admin/lucid-os/crm/clients/:path*",
        destination: "/admin/lucid-os/clients/:path*",
      },
      {
        source: "/admin/lucid-os/growth/leads",
        destination: "/admin/leads",
      },
      {
        source: "/admin/lucid-os/ops/conversations",
        destination: "/admin/conversations",
      },
      {
        source: "/admin/lucid-os/ops/bookings",
        destination: "/admin/bookings",
      },
      {
        source: "/admin/lucid-os/crm/leads",
        destination: "/admin/leads",
      },
      {
        source: "/admin/lucid-os/crm/conversations",
        destination: "/admin/conversations",
      },
      {
        source: "/admin/lucid-os/crm/bookings",
        destination: "/admin/bookings",
      },
      {
        source: "/admin/lucid-os/growth/:path*",
        destination: "/admin/lead-engine/:path*",
      },
      {
        source: "/admin/lucid-os/content/blog/:path*",
        destination: "/admin/blog/:path*",
      },
    ];
  },
};

export default nextConfig;
