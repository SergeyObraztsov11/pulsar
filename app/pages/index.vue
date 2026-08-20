<script setup lang="ts">
/**
 * Landing — hero, топ треков, split-фичи, тренды.
 * Данные с API; секции показывают скелетоны при !data.
 */
import type { Album } from "~/types/album";
import type { Track } from "~/types/track";

definePageMeta({
  layout: "guest-layout",
});

const { data: tracks } = await useFetch<Track[]>("/api/tracks", {
  key: "index:tracks",
  lazy: true,
});

const { data: albums } = await useFetch<Album[]>("/api/albums", {
  key: "index:albums",
  lazy: true,
});

</script>

<template>
  <div class="flex flex-col gap-24">
    <CoverflowHeroSection
      class="animate-fade-up motion-reduce:animate-none [animation-delay:0ms]"
      :items="albums"
    />

    <TracksColumnSection
      class="animate-fade-up motion-reduce:animate-none [animation-delay:120ms]"
      title="Топ треков"
      description="То, что слушают прямо сейчас."
      :items="tracks"
      :genres="[]"
      :limit="5"
      :interactive="false"
    />

    <AlbumsSwiperSection
      class="animate-fade-up motion-reduce:animate-none [animation-delay:360ms]"
      title="В тренде"
      description="Что открывают слушатели прямо сейчас."
      :items="albums"
      :interactive="false"
    />

    <div>
      
    </div>
  </div>
</template>
