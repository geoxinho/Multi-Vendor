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
          "/auth/login",
          "/auth/register",
        ],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/checkout/*",
          "/cart",
          "/auth/forgot-password",
          "/auth/reset-password",
          "/auth/verify-email",
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
          "/auth/login",
          "/auth/register",
        ],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/checkout/*",
          "/cart",
          "/auth/forgot-password",
          "/auth/reset-password",
          "/auth/verify-email",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
