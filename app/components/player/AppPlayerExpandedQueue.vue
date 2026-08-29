<script setup lang="ts">
/**
 * AppPlayerExpandedQueue — предыдущие → источник → текущий → далее в очереди.
 */
import { playerQueueKey } from "~/composables/useTrackCard";
import { queueSourceKindLabel } from "~/stores/player";

const playerStore = usePlayerStore();

const queueTracks = computed(() => playerStore.queue);
const queueSource = computed(() => playerStore.queueSource);
const queueIndex = computed(() => playerStore.queueIndex);

const currentTrack = computed(
  () => queueTracks.value[queueIndex.value] ?? null,
);

const previousTracks = computed(() =>
  queueTracks.value.slice(0, queueIndex.value),
);

const upcomingTracks = computed(() =>
  queueTracks.value.slice(queueIndex.value + 1),
);

const sourceKind = computed(() => {
  const source = queueSource.value;
  return source ? queueSourceKindLabel(source) : null;
});

const sourceTitle = computed(() => {
  const source = queueSource.value;
  const track = currentTrack.value;
  if (!source) return null;
  if (source.title) return source.title;
  if (source.type === "album") return track?.album?.name ?? null;
  if (source.type === "artist") return track?.artist?.name ?? null;
  if (source.type === "likes") return "Лайкнутые";
  return null;
});

provide(playerQueueKey, {
  tracks: queueTracks,
  source: queueSource,
});
</script>

<template>
  <section class="flex flex-col gap-4 pb-8">
    <template v-if="currentTrack">
      <div v-if="previousTracks.length > 0" class="flex flex-col gap-1">
        <TrackCoverCard
          v-for="track in previousTracks"
          :key="track.id"
          :track="track"
          :interactive="true"
        />
      </div>

      <header v-if="sourceKind" class="flex flex-col gap-1">
        <p class="text-sm font-bold leading-none text-primary-white">
          {{ sourceKind }}
        </p>
        <p
          v-if="sourceTitle"
          class="text-2xl font-bold leading-tight text-primary-white"
        >
          {{ sourceTitle }}
        </p>
      </header>

      <div class="flex flex-col gap-1">
        <TrackCoverCard :track="currentTrack" :interactive="true" />
      </div>

      <template v-if="upcomingTracks.length > 0">
        <h3 class="text-2xl font-bold text-primary-white">Далее в очереди</h3>
        <div class="flex flex-col gap-1">
          <TrackCoverCard
            v-for="track in upcomingTracks"
            :key="track.id"
            :track="track"
            :interactive="true"
          />
        </div>
      </template>
    </template>

    <p v-else class="text-sm text-primary-gray">Очередь пуста</p>
  </section>
</template>
