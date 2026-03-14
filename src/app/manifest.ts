import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EdgePoint Holdings - AI Powered Trading",
    short_name: "EdgePoint Holdings",
    description:
      "Advanced AI-driven crypto trading platform and investment management.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/favicon-eh-plain.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
