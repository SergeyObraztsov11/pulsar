<script setup lang="ts">
/**
 * AppPlayerExpandedQueue — правая панель: очередь из playerStore.
 */
import { playerQueueKey } from "~/composables/useTrackCard";

const playerStore = usePlayerStore();

const queueTracks = computed(() => playerStore.queue);
const queueSource = computed(() => playerStore.queueSource);

provide(playerQueueKey, {
  tracks: queueTracks,
  source: queueSource,
});
</script>

<template>
  <section class="flex flex-col gap-4 pb-8">
    <h2 class="text-4xl font-bold text-primary-white">Очередь</h2>
    <div v-if="queueTracks.length > 0" class="flex flex-col gap-1">
      <TrackCoverCard
        v-for="track in queueTracks"
        :key="track.id"
        :track="track"
        :interactive="true"
      />
    </div>
    <p v-else class="text-sm text-primary-gray">Очередь пуста</p>
  </section>
</template>
