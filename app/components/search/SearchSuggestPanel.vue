<script setup lang="ts">
/**
 * SearchSuggestPanel — текстовые подсказки поиска.
 */
import { PhMagnifyingGlass } from "@phosphor-icons/vue";
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { Track } from "~/types/track";
import { albumPath, artistPath, trackPath } from "~/utils/catalogPaths";

const props = defineProps<{
  query: string;
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  showEmpty: boolean;
  hasResults: boolean;
}>();

const searchPageTo = computed(() => ({
  path: "/search",
  query: { q: props.query },
}));

/** Плоский список: треки → альбомы → исполнители */
const items = computed(() => {
  const rows: { id: string; to: string; title: string }[] = [];

  for (const track of props.tracks) {
    rows.push({
      id: `track-${track.id}`,
      to: trackPath(track),
      title: track.name,
    });
  }
  for (const album of props.albums) {
    rows.push({
      id: `album-${album.id}`,
      to: albumPath(album),
      title: album.name,
    });
  }
  for (const artist of props.artists) {
    rows.push({
      id: `artist-${artist.id}`,
      to: artistPath(artist),
      title: artist.name,
    });
  }

  return rows;
});
</script>

<template>
  <div class="flex min-w-0 flex-col">
    <!-- Шапка запроса -->
    <p class="truncate px-3 py-2 text-sm leading-none text-primary-gray">
      Поиск «{{ props.query }}»
    </p>

    <!-- Ничего не найдено -->
    <div
      v-if="props.showEmpty"
      class="flex items-center gap-2 px-3 py-2 text-primary-gray"
    >
      <PhMagnifyingGlass class="shrink-0" :size="20" weight="light" />
      <p class="text-sm leading-normal">Ничего не найдено.</p>
    </div>

    <!-- Текстовые строки -->
    <template v-else>
      <SearchResultRow
        v-for="item in items"
        :key="item.id"
        :to="item.to"
        :title="item.title"
      />

      <NuxtLink
        v-if="props.hasResults"
        class="px-3 py-2 text-right text-sm text-primary-gray hover:text-primary-white hover:underline"
        :to="searchPageTo"
      >
        Все результаты
      </NuxtLink>
    </template>
  </div>
</template>
