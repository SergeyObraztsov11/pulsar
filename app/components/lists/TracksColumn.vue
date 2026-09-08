<script setup lang="ts">
/**
 * TracksColumn — вертикальный столбик треков.
 * variant: cover | ranked | index → какая карточка.
 */
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";
import { playerQueueKey } from "~/composables/useTrackCard";

const props = withDefaults(
  defineProps<{
    items?: Track[];
    variant?: "cover" | "ranked" | "index";
    interactive?: boolean;
    /** Контекст очереди для play с карточки */
    queueSource?: PlayerQueueSource | null;
  }>(),
  {
    items: () => [],
    variant: "cover",
    interactive: true,
  },
);

const queueTracks = computed(() => props.items);
const queueSource = computed(() => props.queueSource ?? null);

provide(playerQueueKey, {
  tracks: queueTracks,
  source: queueSource,
});
</script>

<template>
  <div v-if="props.items.length" class="flex flex-col gap-1">
    <template v-if="props.variant === 'cover'">
      <TrackCoverCard
        v-for="track in props.items"
        :key="track.id"
        :track="track"
        :interactive="props.interactive"
      />
    </template>
    <template v-else-if="props.variant === 'ranked'">
      <TrackRankedCard
        v-for="(track, index) in props.items"
        :key="track.id"
        :track="track"
        :rank="index + 1"
        :interactive="props.interactive"
      />
    </template>
    <template v-else>
      <TrackIndexCard
        v-for="track in props.items"
        :key="track.id"
        :track="track"
        :interactive="props.interactive"
      />
    </template>
  </div>
</template>
