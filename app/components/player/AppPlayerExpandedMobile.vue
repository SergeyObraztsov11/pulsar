<script setup lang="ts">
/**
 * AppPlayerExpandedMobile — полноэкранный expanded-плеер (< lg).
 * Режимы: player | queue | lyrics (как desktop side panel).
 */
type MobilePanel = "player" | "queue" | "lyrics";

import { formatTimeMmSs } from "~/utils/formatTime";

const playerStore = usePlayerStore();
const moreOpen = ref(false);
const sidePanel = ref<MobilePanel>("player");

const track = computed(() => playerStore.current);

const coverSrc = computed(() => track.value?.album?.coverSrc ?? null);
const nameLabel = computed(() => track.value?.name ?? "Трек");
const artistLabel = computed(() => track.value?.artist?.name ?? "Исполнитель");

const trackId = computed(() => track.value?.id ?? "");
const albumTo = computed(() => {
  const value = track.value;
  const artistId = value?.artist?.id;
  const albumId = value?.album?.id;
  if (!artistId || !albumId) return "/";
  return `/user/${artistId}/album/${albumId}`;
});
const artistTo = computed(() => {
  const artistId = track.value?.artist?.id;
  return artistId ? `/user/${artistId}` : undefined;
});
const trackTo = computed(() => {
  const value = track.value;
  const artistId = value?.artist?.id;
  const albumId = value?.album?.id;
  if (!value?.id || !artistId || !albumId) return undefined;
  return `/user/${artistId}/album/${albumId}/track/${value.id}`;
});
const artistToMenu = computed(() => artistTo.value ?? "/");

const isPlayingCurrent = computed(
  () => playerStore.isPlaying && Boolean(track.value),
);

const { isLiked, pending, toggleLike } = useLike(
  "track",
  () => track.value?.id,
  { initial: computed(() => track.value?.isLiked) },
);

const chromeIcon = computed(() =>
  sidePanel.value === "player" ? "CaretDown" : "CaretLeft",
);

const chromeButtonAriaLabel = computed(() =>
  sidePanel.value === "player" ? "Свернуть" : "Назад",
);

const likeAriaLabel = computed(() =>
  isLiked.value
    ? "Убрать из «Мне нравится»"
    : "Добавить в «Мне нравится»",
);

watch(
  () => playerStore.isExpanded,
  (open) => {
    if (!open) sidePanel.value = "player";
  },
);

function openSidePanel(panel: "queue" | "lyrics") {
  sidePanel.value = panel;
}

function onChromeClick() {
  if (sidePanel.value !== "player") {
    sidePanel.value = "player";
    return;
  }
  playerStore.closeExpanded();
}

const currentTimeLabel = computed(() => formatTimeMmSs(playerStore.currentTime));
const durationLabel = computed(() => formatTimeMmSs(playerStore.duration));

function onScrub(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) playerStore.previewSeek(value);
}

function onSeekCommit(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) playerStore.seek(value);
}
</script>

<template>
  <Transition name="player-expand-mobile">
    <div
      v-if="playerStore.showPlayer && playerStore.isExpanded"
      class="absolute inset-0 z-50 flex flex-col overflow-hidden bg-primary-black lg:hidden"
    >
      <!-- Chrome -->
      <header class="flex shrink-0 justify-end px-4 pt-4">
        <UiButton
          class="scale-125"
          variant="gray"
          :icon="chromeIcon"
          :aria-label="chromeButtonAriaLabel"
          @click="onChromeClick"
        />
      </header>

      <!-- Player / queue / lyrics -->
      <main class="panel-scroll min-h-0 flex-1 overflow-y-auto px-6">
        <Transition name="side-panel-fade" mode="out-in">
          <!-- Player -->
          <div
            v-if="sidePanel === 'player'"
            key="player"
            class="flex min-h-full flex-col justify-center py-2"
          >
            <div class="mx-auto w-full max-w-sm ">
              <div
                class="mx-auto aspect-square w-[88%] overflow-hidden rounded-xl bg-primary-gray-dark"
              >
                <UiCoverImage :src="coverSrc" :alt="nameLabel" />
              </div>

              <div class="mt-6 flex flex-col items-center gap-1 text-center">
                <p class="max-w-full truncate text-2xl font-bold text-primary-white">
                  <NuxtLink
                    v-if="trackTo"
                    :to="trackTo"
                    @click="playerStore.closeExpanded()"
                  >
                    {{ nameLabel }}
                  </NuxtLink>
                  <span v-else>{{ nameLabel }}</span>
                </p>
                <p class="max-w-full truncate text-sm text-primary-gray">
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

              <div class="mt-8 flex flex-col gap-2">
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
                  class="flex justify-between text-xs leading-none text-primary-gray tabular-nums"
                >
                  <span>{{ currentTimeLabel }}</span>
                  <span>{{ durationLabel }}</span>
                </div>
              </div>

              <div
                class="mt-10 grid w-full grid-cols-[1fr_auto_1fr] items-center"
              >
                <div class="flex justify-start">
                  <TrackMoreMenu
                    v-if="track"
                    v-model:open="moreOpen"
                    :track-id="trackId"
                    :album-to="albumTo"
                    :artist-to="artistToMenu"
                    :is-playing-current="isPlayingCurrent"
                    :is-liked="isLiked"
                    @play="playerStore.togglePlaying()"
                    @toggle-like="toggleLike()"
                  >
                    <template #trigger>
                      <UiButton
                        class="scale-125"
                        variant="gray"
                        icon="DotsThree"
                        aria-label="Ещё"
                      />
                    </template>
                  </TrackMoreMenu>
                </div>

                <div class="flex items-center justify-center gap-8">
                  <UiButton
                    class="scale-125"
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
                    class="scale-125"
                    variant="ghost"
                    icon="SkipForward"
                    filled
                    aria-label="Следующий"
                    @click="playerStore.next()"
                  />
                </div>

                <div class="flex justify-end">
                  <UiButton
                    class="scale-125"
                    variant="gray"
                    icon="Heart"
                    :filled="isLiked"
                    :disabled="!track || pending"
                    :aria-label="likeAriaLabel"
                    @click="toggleLike()"
                  />
                </div>
              </div>

              <div
                class="mt-10 flex w-full items-center justify-between"
                aria-label="Дополнительные действия плеера"
              >
                <UiButton
                  variant="gray"
                  icon="Queue"
                  aria-label="Очередь"
                  @click="openSidePanel('queue')"
                />
                <UiButton
                  variant="gray"
                  icon="TextAlignLeft"
                  aria-label="Текст"
                  @click="openSidePanel('lyrics')"
                />
                <UiButton
                  variant="gray"
                  icon="Shuffle"
                  aria-label="Перемешивание"
                  disabled
                />
                <UiButton
                  variant="gray"
                  icon="Repeat"
                  aria-label="Повтор"
                  disabled
                />
              </div>
            </div>
          </div>

          <!-- Queue -->
          <div
            v-else-if="sidePanel === 'queue'"
            key="queue"
            class="mx-auto w-full max-w-sm py-4 "
          >
            <AppPlayerExpandedQueue />
          </div>

          <!-- Lyrics -->
          <div v-else key="lyrics" class="mx-auto w-full max-w-sm py-4 ">
            <AppPlayerExpandedLyrics />
          </div>
        </Transition>
      </main>
    </div>
  </Transition>
</template>

<style scoped>
.player-expand-mobile-enter-active,
.player-expand-mobile-leave-active {
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}

.player-expand-mobile-enter-from,
.player-expand-mobile-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.side-panel-fade-enter-active,
.side-panel-fade-leave-active {
  transition: opacity 0.28s ease;
}

.side-panel-fade-enter-from,
.side-panel-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .player-expand-mobile-enter-active,
  .player-expand-mobile-leave-active,
  .side-panel-fade-enter-active,
  .side-panel-fade-leave-active {
    transition: none;
  }
}

.panel-scroll {
  scrollbar-width: none;
}

.panel-scroll::-webkit-scrollbar {
  display: none;
}

.progress-slider {
  height: 0.75rem;
  border-radius: 9999px;
  --progress-fill: var(--color-primary-white);
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
  background-color: var(--progress-fill);
}

.progress-slider::-moz-range-thumb {
  width: 0.75rem;
  height: 0.75rem;
  border: none;
  border-radius: 9999px;
  background-color: var(--progress-fill);
}
</style>
