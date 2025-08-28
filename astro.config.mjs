// astro.config.ts
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "server",
  site: "https://talitacamilo.pages.dev",
  vite: { plugins: [tailwindcss()] },
  integrations: [
    alpinejs({ entrypoint: "/src/alpine-entry" }),
    react(),
    sitemap(),
  ],
  adapter: cloudflare(),
});
