import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin subdomain serves its own X-Robots-Tag via the proxy; this
        // covers lucid-lab.fr/admin, which stays reachable.
        disallow: ["/portal", "/admin"],
      },
    ],
    sitemap: "https://lucid-lab.fr/sitemap.xml",
  }
}
