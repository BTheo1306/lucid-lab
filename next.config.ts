import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "admin.localhost",
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
