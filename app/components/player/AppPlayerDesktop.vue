<script setup lang="ts">
/**
 * AppPlayerDesktop — мини-плеер для lg+ (h-16), как в SoundCloud:
 * transport | meta | progress на всю ширину + время | volume (hover) + expand.
 */
const playerStore = usePlayerStore();

/** Иконка громкости по mute / уровню */
const volumeIcon = computed(() => {
  if (playerStore.isVolumeMuted) return "SpeakerSimpleX" as const;
  if (playerStore.volume >= 0.5) return "SpeakerHigh" as const;
  if (playerStore.volume >= 0.25) return "SpeakerLow" as const;
  return "SpeakerNone" as const;
});

/** mm:ss из секунд */
function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

const currentTimeLabel = computed(() => formatTime(playerStore.currentTime));

const volumePct = computed({
  get: () => Math.round(playerStore.volume * 100),
  set: (value: number) => {
    playerStore.unmuteVolume();
    playerStore.setVolume(value / 100);
  },
});

const track = computed(() => playerStore.current);

const nameLabel = computed(() => track.value?.name ?? "Трек");
const artistLabel = computed(
  () => track.value?.artist?.name ?? "Исполнитель",
);

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
  <div class="relative hidden h-16 w-full shrink-0 bg-primary-black lg:block">
    <!-- Как HeaderLayout: max-w-5xl + px-8, бордер на полоске контента -->
    <div class="mx-auto h-full w-full max-w-5xl px-8">
      <div
        class="flex h-full w-full items-center gap-5 border-t border-primary-gray-dark"
      >
        <!-- Transport: слева -->
        <div class="flex shrink-0 items-center gap-2">
          <UiButton
            variant="ghost"
            icon="SkipBack"
            filled
            aria-label="Предыдущий"
            @click="playerStore.prev()"
          />
          <UiButton
            :icon="playerStore.isPlaying ? 'Pause' : 'Play'"
            filled
            :aria-label="playerStore.isPlaying ? 'Пауза' : 'Слушать'"
            @click="playerStore.togglePlaying()"
          />
          <UiButton
            variant="ghost"
            icon="SkipForward"
            filled
            aria-label="Следующий"
            @click="playerStore.next()"
          />
        </div>

        <!-- Meta: обложка + название -->
        <div class="flex max-w-56 min-w-0 shrink-0 items-center gap-3">
          <div
            class="size-10 shrink-0 overflow-hidden rounded-md bg-primary-gray-dark"
          >
            <UiCoverImage
              :src="track?.album.coverSrc"
              :alt="track?.album.name"
            />
          </div>
          <div class="min-w-0 leading-tight">
            <p class="truncate text-sm font-medium text-primary-white">
              <NuxtLink
                v-if="trackTo"
                :to="trackTo"
                class="hover:underline"
              >
                {{ nameLabel }}
              </NuxtLink>
              <span v-else>{{ nameLabel }}</span>
            </p>
            <p class="truncate text-xs text-primary-gray">
              <NuxtLink
                v-if="artistTo"
                :to="artistTo"
                class="hover:text-accent hover:underline"
              >
                {{ artistLabel }}
              </NuxtLink>
              <span v-else>{{ artistLabel }}</span>
            </p>
          </div>
        </div>

        <!-- Progress: тянется на всё свободное место -->
        <div
          class="progress-panel group relative flex h-3 min-w-0 flex-1 items-center"
        >
          <div
            class="pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 rounded-md bg-primary-gray-dark px-2 py-1 text-xs leading-none text-primary-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none"
            :style="{ left: `${playerStore.progressRatio * 100}%` }"
          >
            {{ currentTimeLabel }}
          </div>

          <input
            :value="playerStore.currentTime"
            type="range"
            min="0"
            :max="playerStore.duration || 0"
            step="0.1"
            :disabled="!track"
            class="progress-slider w-full cursor-pointer appearance-none"
            :style="{ '--progress-pct': `${playerStore.progressRatio * 100}%` }"
            @input="onScrub"
            @change="onSeekCommit"
            @pointerup="onSeekCommit"
          />
        </div>

        <!-- Время: текущее / всего -->
        <p class="shrink-0 text-xs leading-none text-primary-gray tabular-nums">
          {{ currentTimeLabel }} / {{ formatTime(playerStore.duration) }}
        </p>

        <!-- Громкость (hover) + раскрытие -->
        <div class="flex shrink-0 items-center gap-1">
          <div class="group relative flex items-center justify-center">
            <!--
              Панель громкости над кнопкой.
              pb-3 — «мост» до иконки, чтобы курсор не терял hover.
            -->
            <div
              class="pointer-events-none absolute bottom-full left-1/2 z-10 flex -translate-x-1/2 flex-col items-center pb-3 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 motion-reduce:transition-none"
            >
              <div
                class="volume-panel flex items-center justify-center rounded-full border border-primary-gray-dark bg-primary-black p-2"
              >
                <input
                  v-model.number="volumePct"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  class="volume-slider h-28 w-2 cursor-pointer appearance-none"
                  :style="{ '--volume-pct': `${volumePct}%` }"
                />
              </div>
            </div>

            <UiButton
              variant="ghost"
              :icon="volumeIcon"
              filled
              aria-label="Громкость"
              @click="playerStore.toggleVolume()"
            />
          </div>

          <UiButton
            variant="ghost"
            icon="CaretUp"
            aria-label="Развернуть"
            @click="playerStore.openExpanded()"
          />
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

/*
  Вертикальный range громкости.
  --volume-pct — уровень снизу вверх.
*/
.volume-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  border-radius: 9999px;
  --volume-fill: var(--color-primary-gray-light);
  --volume-track: var(--color-primary-gray);
  background: linear-gradient(
    to top,
    var(--volume-fill) 0%,
    var(--volume-fill) var(--volume-pct),
    var(--volume-track) var(--volume-pct),
    var(--volume-track) 100%
  );
}

.volume-panel:hover .volume-slider {
  --volume-fill: var(--color-primary-white);
}

.volume-slider::-webkit-slider-runnable-track {
  appearance: none;
  width: 100%;
  height: 100%;
  background: transparent;
}

.volume-slider::-moz-range-track {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: var(--volume-fill);
}

.volume-panel:hover .volume-slider::-webkit-slider-thumb {
  width: 0.75rem;
  height: 0.75rem;
  margin-left: -0.125rem;
}

.volume-slider::-moz-range-thumb {
  width: 0.5rem;
  height: 0.5rem;
  border: none;
  border-radius: 9999px;
  background-color: var(--volume-fill);
}

.volume-panel:hover .volume-slider::-moz-range-thumb {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
