<script setup lang="ts">
/**
 * Home — идея SoundCloud: звук как интерфейс.
 * Герой-волна → лента с тегами → полки → creator-CTA.
 */
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { Genre } from "~/types/genre";
import type { Track } from "~/types/track";

definePageMeta({
  layout: "app-layout",
});

const { data: likedAlbums } = await useFetch<Album[]>("/api/albums", {
  key: "home:albums:liked",
  query: { liked: "true", sort: "likedAt" },
  lazy: true,
});

const { data: newestAlbums } = await useFetch<Album[]>("/api/albums", {
  key: "home:albums:newest",
  query: { sort: "newest" },
  lazy: true,
});

const { data: tracks } = await useFetch<Track[]>("/api/tracks", {
  key: "home:tracks",
  lazy: true,
});

const { data: artists } = await useFetch<Artist[]>("/api/artists", {
  key: "home:artists:name",
  query: { sort: "name" },
  lazy: true,
});

const hasLikedAlbums = computed(
  () => likedAlbums.value != null && likedAlbums.value.length > 0,
);

/** Личная полка: лайки или каталог */
const shelfItems = computed(() => {
  if (likedAlbums.value == null) return null;
  if (likedAlbums.value.length > 0) return likedAlbums.value;
  return newestAlbums.value;
});

const shelfTitle = computed(() =>
  hasLikedAlbums.value ? "Мне нравится" : "Для тебя",
);

const shelfTo = computed(() => {
  if (hasLikedAlbums.value) return "/likes";
  if (likedAlbums.value != null) return "/search";
  return undefined;
});

/** Теги-жанры под лентой; null пока данные не пришли */
const genreTags = computed(() => {
  if (tracks.value == null && newestAlbums.value == null) return null;
  const map = new Map<string, Genre>();
  for (const track of tracks.value ?? []) {
    for (const genre of track.genres) {
      map.set(genre.id, genre);
    }
  }
  for (const album of newestAlbums.value ?? []) {
    for (const genre of album.genres) {
      map.set(genre.id, genre);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
});
</script>

<template>
  <div class="flex flex-col gap-16">
   
    <!-- Личная полка -->
    <!-- Animation: fade-up + delay 240ms -->
    <AlbumsSwiperSection
      class="animate-fade-up motion-reduce:animate-none [animation-delay:240ms]"
      :title="shelfTitle"
      :to="shelfTo"
      :items="shelfItems"
      :limit="8"
    />
    <pre>{{ newestAlbums }}</pre>
    <!-- Новое и на подъёме -->
    <!-- Animation: fade-up + delay 360ms -->
    <AlbumsSwiperSection
      class="animate-fade-up motion-reduce:animate-none [animation-delay:360ms]"
      title="Новое и на подъёме"
      :items="newestAlbums"
      :limit="8"
    />

    <!-- Кого послушать -->
    <!-- Animation: fade-up + delay 480ms -->
    <ArtistsSwiperSection
      class="animate-fade-up motion-reduce:animate-none [animation-delay:480ms]"
      title="Кого послушать"
      :items="artists"
    />

    <!-- Creator CTA -->
    <!-- Animation: fade-up + delay 600ms -->
    <!-- <UploadCtaSection
      class="animate-fade-up motion-reduce:animate-none [animation-delay:600ms]"
    /> -->
  </div>
</template>
