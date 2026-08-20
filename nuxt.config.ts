// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  app: {
    head: {
      title: "Pulsar",
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
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
