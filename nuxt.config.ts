// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { THEME_INIT_SCRIPT } from "./shared/theme";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  alias: {
    "#shared": fileURLToPath(new URL("./shared", import.meta.url)),
  },

  app: {
    head: {
      title: "Pulsar",
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      // Blocking: cookie / system → class before first paint (no FOUC).
      script: [
        {
          innerHTML: THEME_INIT_SCRIPT,
          tagPosition: "head",
        },
      ],
    },
  },

  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ["@pinia/nuxt", "nuxt-auth-utils"],
  // pathPrefix: false — keep file names (AlbumCard, not CardsAlbumsAlbumCard).
  components: [{ path: "~/components", pathPrefix: false }],
  runtimeConfig: {
    s3: {
      endpoint: "http://127.0.0.1:9000",
      region: "us-east-1",
      accessKey: "",
      secretKey: "",
      bucket: "media",
    },
  },
});
