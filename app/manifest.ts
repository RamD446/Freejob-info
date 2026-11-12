import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "freejob-info",
    short_name: "freejob-info",
    description: "Government jobs, private openings, and walk-in job alerts.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f8",
    theme_color: "#123b62",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}