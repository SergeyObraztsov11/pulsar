<script setup lang="ts">
/**
 * AlbumsGrid — плитка альбомов (библиотека / поиск / «все»).
 */
import type { Album } from "~/types/album";

const props = withDefaults(
  defineProps<{
    items?: Album[];
    interactive?: boolean;
    /** false — без строки артиста под названием */
    showArtist?: boolean;
  }>(),
  {
    items: () => [],
    interactive: true,
    showArtist: true,
  },
);
</script>

<template>
  <div
    v-if="props.items.length"
    class="grid w-full grid-cols-[repeat(auto-fill,12rem)] justify-around gap-6 md:justify-between"
  >
    <AlbumCard
      v-for="album in props.items"
      :key="album.id"
      :album="album"
      :interactive="props.interactive"
      :show-artist="props.showArtist"
    />
  </div>
</template>
