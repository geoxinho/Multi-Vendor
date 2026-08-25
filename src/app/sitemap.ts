import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://campusgo.vercel.app";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    // Active in-stock products
    const products = await Product.find({ status: "active" })
      .select("_id updatedAt createdAt")
      .limit(1000)
      .lean();

    productRoutes = products.map((p: any) => ({
      url: `${baseUrl}/products/${p._id}`,
      lastModified: p.updatedAt || p.createdAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    // Categories
    const categories = await Category.find().select("slug updatedAt createdAt").lean();
    categoryRoutes = categories.map((c: any) => ({
      url: `${baseUrl}/products?category=${c.slug}`,
      lastModified: c.updatedAt || c.createdAt || new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[SITEMAP GENERATION ERROR]", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
