// astro.config.ts
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

export default defineConfig({
  output: "server",
  vite: { plugins: [tailwindcss()] },
  integrations: [alpinejs({ entrypoint: "/src/alpine-entry" }), react()],
  adapter: cloudflare(),
});
