<script setup lang="ts">
/**
 * Строка лайкнутого альбома в боковой библиотеке.
 */
import type { Album } from "~/types/album";
import { albumPath } from "~/utils/catalogPaths";

const props = defineProps<{
  album: Album;
  active?: boolean;
}>();

const to = computed(() => albumPath(props.album));
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex min-w-0 items-center gap-3 rounded-md p-2 transition-colors duration-200 hover:bg-tone-surface motion-reduce:transition-none"
    :class="active ? 'bg-tone-surface' : null"
  >
    <div class="size-12 shrink-0 overflow-hidden rounded bg-tone-surface">
      <UiCoverImage :src="album.coverSrc" :alt="album.name" />
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-base font-medium">{{ album.name }}</p>
      <p class="truncate text-sm text-tone-muted">
        Альбом · {{ album.artist.name }}
      </p>
    </div>
  </NuxtLink>
</template>
