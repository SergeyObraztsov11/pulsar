<script setup lang="ts">
/**
 * Строка плейлиста в боковой библиотеке.
 */
import { PhListHeart, PhQueue } from "@phosphor-icons/vue";
import type { PlaylistSummary } from "~/types/playlist";
import { playlistPath } from "~/utils/catalogPaths";
import { formatCountRu } from "~/utils/pluralizeRu";

const props = defineProps<{
  playlist: PlaylistSummary;
  active?: boolean;
}>();

const to = computed(() => playlistPath(props.playlist));

const metaLabel = computed(() => {
  if (props.playlist.trackCount === 0) return "Плейлист · Пусто";
  const count = formatCountRu(
    props.playlist.trackCount,
    "трек",
    "трека",
    "треков",
  );
  return `Плейлист · ${count}`;
});

const isLiked = computed(
  () => props.playlist.systemKind === "liked_tracks",
);

const coverIcon = computed(() => (isLiked.value ? PhListHeart : PhQueue));
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex min-w-0 items-center gap-3 rounded-md p-2 transition-colors duration-200 hover:bg-tone-surface motion-reduce:transition-none"
    :class="active ? 'bg-tone-surface' : null"
  >
    <div
      class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-tone-surface"
      :class="isLiked ? 'bg-tone-surface-hover' : null"
    >
      <UiCoverImage
        v-if="playlist.coverSrc"
        :src="playlist.coverSrc"
        :alt="playlist.name"
      />
      <component
        :is="coverIcon"
        v-else
        :size="24"
        :weight="isLiked ? 'fill' : 'light'"
      />
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-base font-medium">{{ playlist.name }}</p>
      <p class="truncate text-sm text-tone-muted">{{ metaLabel }}</p>
    </div>
  </NuxtLink>
</template>
