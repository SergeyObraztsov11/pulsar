<script setup lang="ts">
/**
 * AppPlayerExpandedMain — левая колонка expanded: обложка, transport, meta, progress.
 */

const playerStore = usePlayerStore();

const track = computed(() => playerStore.current);

const coverSrc = computed(() => track.value?.album?.coverSrc ?? null);
const nameLabel = computed(() => track.value?.name ?? "Трек");
const artistLabel = computed(() => track.value?.artist?.name ?? "Исполнитель");

const trackTo = computed(() => {
  const value = track.value;
  const artistId = value?.artist?.id;
  const albumId = value?.album?.id;
  if (!value?.id || !artistId || !albumId) return undefined;
  return `/user/${artistId}/album/${albumId}/track/${value.id}`;
});

const artistTo = computed(() => {
  const artistId = track.value?.artist?.id;
  return artistId ? `/user/${artistId}` : undefined;
});

/** Лайк текущего трека (локально, как в карточках) */
const isLiked = ref(false);
watch(
  () => track.value?.isLiked,
  (value) => {
    if (value != null) isLiked.value = value;
  },
  { immediate: true },
);

/** mm:ss из секунд */
function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

const currentTimeLabel = computed(() => formatTime(playerStore.currentTime));

const durationLabel = computed(() => formatTime(playerStore.duration));

/** Секунды с input[type=range] */
function secondsFromEvent(event: Event) {
  return Number((event.target as HTMLInputElement).value);
}

/** Пока зажат ползунок — только UI */
function onScrub(event: Event) {
  const value = secondsFromEvent(event);
  if (Number.isFinite(value)) playerStore.previewSeek(value);
}

/** Отпустили — перемотать audio */
function onSeekCommit(event: Event) {
  const value = secondsFromEvent(event);
  if (Number.isFinite(value)) playerStore.seek(value);
}
</script>

<template>
  <div
    class="relative z-10 flex flex-col items-center justify-center px-8 pt-20 pb-12 lg:min-h-0 lg:p-16"
  >
    <div class="flex w-80 flex-col items-center gap-6 lg:w-96">
      <!-- Обложка: controls при наведении -->
      <div
        class="group relative aspect-square w-full overflow-hidden rounded-xl bg-primary-gray-dark"
      >
        <UiCoverImage :src="coverSrc" :alt="nameLabel" />

        <div
          class="absolute inset-0 bg-primary-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:opacity-100"
        >
          <!-- Transport по центру -->
          <div class="absolute inset-0 flex items-center justify-center gap-6">
            <UiButton
              class="scale-150"
              variant="ghost"
              icon="SkipBack"
              filled
              aria-label="Предыдущий"
              @click="playerStore.prev()"
            />
            <UiButton
              class="scale-150"
              variant="white"
              :icon="playerStore.isPlaying ? 'Pause' : 'Play'"
              filled
              :aria-label="playerStore.isPlaying ? 'Пауза' : 'Слушать'"
              @click="playerStore.togglePlaying()"
            />
            <UiButton
              class="scale-150"
              variant="ghost"
              icon="SkipForward"
              filled
              aria-label="Следующий"
              @click="playerStore.next()"
            />
          </div>

          <!-- Лайк и more снизу -->
          <div
            class="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4"
          >
            <UiButton
              class="scale-125"
              variant="gray"
              icon="Heart"
              :filled="isLiked"
              :aria-label="isLiked ? 'Убрать из любимых' : 'В любимое'"
              @click="isLiked = !isLiked"
            />

            <UiButton
              class="scale-125"
              variant="gray"
              icon="DotsThree"
              aria-label="Ещё"
            />
          </div>
        </div>
      </div>

      <!-- Meta трека -->
      <div class="flex w-full flex-col items-center gap-1 text-center">
        <p class="max-w-full truncate text-2xl font-bold text-primary-white">
          <NuxtLink
            v-if="trackTo"
            :to="trackTo"
            class=""
            @click="playerStore.closeExpanded()"
          >
            {{ nameLabel }}
          </NuxtLink>
          <span v-else>{{ nameLabel }}</span>
        </p>
        <p class="max-w-full truncate text-base text-primary-gray">
          <NuxtLink
            v-if="artistTo"
            :to="artistTo"
            class="hover:text-primary-white"
            @click="playerStore.closeExpanded()"
          >
            {{ artistLabel }}
          </NuxtLink>
          <span v-else>{{ artistLabel }}</span>
        </p>
      </div>

      <!-- Progress: ширина = обложка; время по бокам при hover -->
      <div class="progress-panel group flex w-full flex-col gap-2">
        <div class="relative flex h-3 w-full items-center">
          <input
            :value="playerStore.currentTime"
            type="range"
            min="0"
            :max="playerStore.duration || 0"
            step="0.1"
            :disabled="!track"
            class="progress-slider w-full cursor-pointer appearance-none disabled:cursor-default"
            :style="{
              '--progress-pct': `${playerStore.progressRatio * 100}%`,
            }"
            @input="onScrub"
            @change="onSeekCommit"
            @pointerup="onSeekCommit"
          />
        </div>
        <div
          class="flex justify-between text-xs leading-none text-primary-gray tabular-nums opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none"
        >
          <span>{{ currentTimeLabel }}</span>
          <span>{{ durationLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  Высота input = размер бегунка → кружок по центру.
  Тонкий трек — через background-size.
*/
.progress-slider {
  height: 0.75rem;
  border-radius: 9999px;
  --progress-fill: var(--color-primary-gray);
  --progress-track: var(--color-primary-gray-dark);
  background: linear-gradient(
    to right,
    var(--progress-fill) 0%,
    var(--progress-fill) var(--progress-pct),
    var(--progress-track) var(--progress-pct),
    var(--progress-track) 100%
  );
  background-size: 100% 0.25rem;
  background-position: center;
  background-repeat: no-repeat;
}

.progress-panel:hover .progress-slider {
  --progress-fill: var(--color-primary-white);
}

.progress-slider::-webkit-slider-runnable-track {
  appearance: none;
  height: 100%;
  background: transparent;
}

.progress-slider::-moz-range-track {
  height: 0.25rem;
  border: none;
  background: transparent;
}

.progress-slider::-webkit-slider-thumb {
  appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  background-color: transparent;
}

.progress-panel:hover .progress-slider::-webkit-slider-thumb {
  background-color: var(--progress-fill);
}

.progress-slider::-moz-range-thumb {
  width: 0.75rem;
  height: 0.75rem;
  border: none;
  border-radius: 9999px;
  background-color: transparent;
}

.progress-panel:hover .progress-slider::-moz-range-thumb {
  background-color: var(--progress-fill);
}
</style>
