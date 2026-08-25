import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://campusgo.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/help",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/checkout/*",
          "/cart",
          "/auth/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/products",
          "/products/*",
          "/help",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/checkout/*",
          "/cart",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
