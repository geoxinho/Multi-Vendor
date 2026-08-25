import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusGo — Adeleke University Marketplace",
    short_name: "CampusGo",
    description:
      "Buy and sell new & used products from verified student sellers at Adeleke University. Nigeria's campus marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#A4860E",
    icons: [
      {
        src: "/main_logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/main_logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
