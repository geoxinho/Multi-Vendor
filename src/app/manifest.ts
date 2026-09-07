import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusGo — Nigeria's #1 Student Marketplace",
    short_name: "CampusGo",
    description:
      "Buy and sell textbooks, gadgets, fashion & hostel essentials between verified student sellers and buyers across Nigerian university and polytechnic campuses.",
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
