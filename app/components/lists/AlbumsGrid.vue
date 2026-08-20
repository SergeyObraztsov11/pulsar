<script setup lang="ts">
/**
 * AlbumsGrid — плитка альбомов (библиотека / поиск / «все»).
 * items nullish → скелетоны; [] → пусто.
 */
import type { Album } from "~/types/album";

const props = withDefaults(
  defineProps<{
    items?: Album[] | null;
    interactive?: boolean;
    skeletonCount?: number;
    limit?: number;
  }>(),
  {
    interactive: true,
    skeletonCount: 10,
  },
);

const isLoading = computed(() => props.items == null);

const visibleItems = computed(() => {
  if (!props.items) return [];
  return props.limit != null ? props.items.slice(0, props.limit) : props.items;
});
</script>

<template>
  <!-- Albums grid -->
  <div
    class="grid w-full grid-cols-[repeat(auto-fill,12rem)] justify-around gap-6 md:justify-between"
  >
    <template v-if="isLoading">
      <AlbumCardSkeleton v-for="n in props.skeletonCount" :key="n" />
    </template>
    <template v-else>
      <AlbumCard
        v-for="album in visibleItems"
        :key="album.id"
        :album="album"
        :interactive="props.interactive"
      />
    </template>
  </div>
</template>
