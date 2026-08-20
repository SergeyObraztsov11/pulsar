<script setup lang="ts">
/**
 * TracksColumn — вертикальный столбик треков + скелетоны.
 * variant: cover | ranked | index → какая карточка.
 */
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";
import { playerQueueKey } from "~/composables/useTrackCard";

const props = withDefaults(
  defineProps<{
    items?: Track[] | null;
    variant?: "cover" | "ranked" | "index";
    interactive?: boolean;
    skeletonCount?: number;
    limit?: number;
    /** Контекст очереди для play с карточки */
    queueSource?: PlayerQueueSource | null;
  }>(),
  {
    variant: "cover",
    interactive: true,
    skeletonCount: 5,
  },
);

const isLoading = computed(() => props.items == null);

const visibleItems = computed(() => {
  if (!props.items) return [];
  return props.limit != null ? props.items.slice(0, props.limit) : props.items;
});

/** В очередь — весь список секции, не только видимый limit */
const queueTracks = computed(() => props.items ?? []);
const queueSource = computed(() => props.queueSource ?? null);

provide(playerQueueKey, {
  tracks: queueTracks,
  source: queueSource,
});
</script>

<template>
  <!-- Tracks column -->
  <div class="flex flex-col gap-1">
    <template v-if="isLoading">
      <TrackCardSkeleton v-for="n in props.skeletonCount" :key="n" />
    </template>

    <template v-else-if="props.variant === 'cover'">
      <TrackCoverCard
        v-for="track in visibleItems"
        :key="track.id"
        :track="track"
        :interactive="props.interactive"
      />
    </template>
    <template v-else-if="props.variant === 'ranked'">
      <TrackRankedCard
        v-for="(track, index) in visibleItems"
        :key="track.id"
        :track="track"
        :rank="index + 1"
        :interactive="props.interactive"
      />
    </template>
    <template v-else>
      <TrackIndexCard
        v-for="track in visibleItems"
        :key="track.id"
        :track="track"
        :interactive="props.interactive"
      />
    </template>
  </div>
</template>
