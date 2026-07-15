import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Ecoute.ia — Coach de bien-être",
        short_name: "Ecoute.ia",
        description:
          "Coach de bien-être IA : échange par texte ou voix, dans un espace d'écoute sans jugement.",
        theme_color: "#5b6ee1",
        background_color: "#f6f5fb",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  server: {
    host: true,
  },
});
