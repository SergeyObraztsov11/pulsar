<script setup lang="ts">
/**
 * AppPlayerExpandedDesktop — полноэкранный плеер (desktop).
 * Слева: обложка + controls; справа: альбом / артист / текст / очередь.
 */
import { PhUser } from "@phosphor-icons/vue";

const playerStore = usePlayerStore();

/** Правая колонка (context + queue) */
const showSidePanel = ref(true);

/** Обложка (заглушка, пока нет трека в store) */
const coverSrc = "/images/p233.jpg";

/** Fixture side-panel context until track lives in the store */
const album = {
  name: "Валентина",
  year: 2024,
  trackCount: 12,
  durationLabel: "42:18",
  coverSrc: "/images/p233.jpg",
  to: "/user/demo/album/valentina",
};

const artist = {
  name: "Платина",
  bio: "Российский рэп-исполнитель. Новый альбом и коллаборации.",
  avatarSrc: "/images/p1.jpg",
  to: "/user/demo",
};

const lyrics = `Я открываю дверь в тишину
Где каждый звук становится светом
Ты слышишь ритм — я слышу тебя
Мы на одной волне до рассвета

Припев:
Держи меня ближе к биту
Пока город не уснёт
В наушниках только мы двое
И бесконечный этот ход`;

/** Lyrics collapsed by default */
const lyricsExpanded = ref(false);

function toggleLyrics() {
  lyricsExpanded.value = !lyricsExpanded.value;
  nextTick(() => updateSideFades());
}

/** mm:ss из секунд */
function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

const currentTimeLabel = computed(() =>
  formatTime(playerStore.currentTime),
);

const durationLabel = computed(() => formatTime(playerStore.duration));

/** Скролл правой колонки: затемнение только если есть контент за краем */
const sideScrollRef = ref<HTMLElement | null>(null);
const fadeTop = ref(false);
const fadeBottom = ref(false);

function updateSideFades() {
  const el = sideScrollRef.value;
  if (!el) {
    fadeTop.value = false;
    fadeBottom.value = false;
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = el;
  const maxScroll = scrollHeight - clientHeight;

  fadeTop.value = scrollTop > 1;
  fadeBottom.value = maxScroll > 1 && scrollTop < maxScroll - 1;
}

watch(
  () => playerStore.isExpanded,
  async (open) => {
    if (!open) {
      lyricsExpanded.value = false;
      return;
    }
    await nextTick();
    updateSideFades();
  },
);

watch(showSidePanel, async (open) => {
  if (!open) return;
  await nextTick();
  updateSideFades();
});
</script>

<template>
  <!-- Expanded desktop: slide up from bottom -->
  <Transition name="player-expand">
    <div
      v-if="playerStore.showPlayer && playerStore.isExpanded"
      class="absolute inset-0 z-50 flex flex-col bg-primary-black"
    >
      <!-- Top-right chrome: side panel toggle (desktop) | collapse -->
      <div class="absolute top-6 right-6 z-10 flex items-center gap-4">
        <UiButton
          class="hidden lg:inline-flex"
          variant="outline"
          :icon="showSidePanel ? 'Sidebar' : 'SidebarSimple'"
          :aria-label="
            showSidePanel ? 'Скрыть панель' : 'Показать панель'
          "
          @click="showSidePanel = !showSidePanel"
        />
        <UiButton
          variant="outline"
          icon="CaretDown"
          aria-label="Свернуть"
          @click="playerStore.closeExpanded()"
        />
      </div>

      <!--
        Mobile: one vertical scroll (player → context).
        Desktop: two columns; side panel width animates 0fr ↔ 1fr.
      -->
      <div
        class="expanded-scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:overflow-hidden lg:duration-500 lg:ease-out motion-reduce:lg:transition-none lg:transition-[grid-template-columns]"
        :class="
          showSidePanel
            ? 'lg:grid-cols-[1fr_1fr]'
            : 'lg:grid-cols-[1fr_0fr]'
        "
      >
        <!-- Player -->
        <div
          class="flex flex-col items-center justify-center px-8 pt-20 pb-12 lg:min-h-0 lg:p-16"
        >
          <div class="flex w-full max-w-sm flex-col items-center gap-6">
            <!-- Cover + glow -->
            <div class="relative size-80 shrink-0">
              <div
                class="absolute inset-0 scale-95 rounded-2xl bg-primary-white/10 blur-2xl"
              />
              <div
                class="relative size-80 overflow-hidden rounded-2xl bg-primary-gray-dark"
              >
                <UiCoverImage :src="coverSrc" />
              </div>
            </div>

            <!-- Track meta -->
            <div class="flex w-full flex-col items-center gap-1 text-center">
              <p class="text-2xl font-bold text-primary-white">
                Track title
              </p>
              <p class="text-xl text-primary-gray">Artist name</p>
            </div>

            <!-- Progress + время -->
            <div class="flex w-full flex-col gap-2">
              <div class="progress-panel group relative flex h-3 w-full items-center">
                <input
                  v-model.number="playerStore.currentTime"
                  type="range"
                  min="0"
                  :max="playerStore.duration"
                  step="1"
                  class="progress-slider w-full cursor-pointer appearance-none"
                  :style="{
                    '--progress-pct': `${playerStore.progressRatio * 100}%`,
                  }"
                />
              </div>
              <div
                class="flex justify-between text-xs leading-none text-primary-gray"
              >
                <span>{{ currentTimeLabel }}</span>
                <span>{{ durationLabel }}</span>
              </div>
            </div>

            <!-- Transport -->
            <div class="flex items-center gap-4">
              <UiButton
                variant="ghost"
                icon="SkipBack"
                aria-label="Предыдущий"
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
                aria-label="Следующий"
              />
            </div>
          </div>
        </div>

        <!-- Context: album / artist / lyrics / queue -->
        <div
          class="min-w-0 shrink-0 lg:flex lg:min-h-0 lg:min-w-0 lg:flex-col lg:overflow-hidden"
          :class="
            showSidePanel
              ? null
              : 'lg:pointer-events-none lg:opacity-0'
          "
        >
          <div
            class="flex flex-col px-8 pb-16 transition-opacity duration-300 ease-out motion-reduce:transition-none lg:min-h-0 lg:min-w-0 lg:flex-1 lg:px-16 lg:py-16"
            :class="showSidePanel ? 'lg:opacity-100' : 'lg:opacity-0'"
          >
            <div class="relative lg:min-h-0 lg:flex-1">
              <!-- Fade top — desktop side scroll only -->
              <div
                class="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-16 bg-linear-to-b from-primary-black to-transparent transition-opacity duration-200 lg:block"
                :class="fadeTop ? 'opacity-100' : 'opacity-0'"
              />
              <!-- Fade bottom — desktop side scroll only -->
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-16 bg-linear-to-t from-primary-black to-transparent transition-opacity duration-200 lg:block"
                :class="fadeBottom ? 'opacity-100' : 'opacity-0'"
              />

              <div
                ref="sideScrollRef"
                class="side-scroll px-2 lg:h-full lg:overflow-y-auto"
                @scroll="updateSideFades"
              >
                <div class="flex flex-col gap-10 pb-8">
                  <!-- About album -->
                  <section class="flex flex-col gap-4">
                    <h2
                      class="text-2xl font-bold text-primary-white"
                    >
                      Альбом
                    </h2>
                    <NuxtLink
                      :to="album.to"
                      class="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-primary-gray-dark"
                    >
                      <div
                        class="relative size-16 shrink-0 overflow-hidden rounded-lg bg-primary-gray-dark"
                      >
                        <UiCoverImage :src="album.coverSrc" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p
                          class="truncate text-base font-medium text-primary-white"
                        >
                          {{ album.name }}
                        </p>
                        <p class="truncate text-sm text-primary-gray">
                          {{ album.year }} · {{ album.trackCount }} треков ·
                          {{ album.durationLabel }}
                        </p>
                      </div>
                    </NuxtLink>
                  </section>

                  <!-- About artist -->
                  <section class="flex flex-col gap-4">
                    <h2
                      class="text-2xl font-bold text-primary-white"
                    >
                      Артист
                    </h2>
                    <div class="flex flex-col gap-3">
                      <NuxtLink
                        :to="artist.to"
                        class="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-primary-gray-dark"
                      >
                        <div
                          class="relative size-16 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
                        >
                          <UiCoverImage
                            :src="artist.avatarSrc"
                            :icon="PhUser"
                          />
                        </div>
                        <p
                          class="min-w-0 truncate text-base font-medium text-primary-white"
                        >
                          {{ artist.name }}
                        </p>
                      </NuxtLink>
                      <p
                        v-if="artist.bio"
                        class="px-2 text-sm leading-relaxed text-primary-gray"
                      >
                        {{ artist.bio }}
                      </p>
                    </div>
                  </section>

                  <!-- Lyrics (collapsed by default) -->
                  <section v-if="lyrics" class="flex flex-col gap-4">
                    <h2
                      class="text-2xl font-bold text-primary-white"
                    >
                      Текст
                    </h2>
                    <div class="flex flex-col gap-3 px-2">
                      <p
                        class="whitespace-pre-line text-sm leading-relaxed text-primary-gray"
                        :class="lyricsExpanded ? null : 'line-clamp-4'"
                      >
                        {{ lyrics }}
                      </p>
                      <button
                        type="button"
                        class="self-start text-sm text-primary-white hover:text-primary-gray"
                        @click="toggleLyrics"
                      >
                        {{ lyricsExpanded ? "Свернуть" : "Показать ещё" }}
                      </button>
                    </div>
                  </section>

                  <!-- Queue -->
                  <section class="flex flex-col gap-4">
                    <h2
                      class="text-2xl font-bold text-primary-white"
                    >
                      Очередь
                    </h2>
                    <div class="flex flex-col gap-1">
                      <TrackCoverCard
                        v-for="number in 15"
                        :key="number"
                        :track="{ id: String(number), coverSrc: '/images/p233.jpg' }"
                      />
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.player-expand-enter-active,
.player-expand-leave-active {
  transition: transform 0.35s ease;
}

.player-expand-enter-from,
.player-expand-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .player-expand-enter-active,
  .player-expand-leave-active {
    transition: none;
  }
}

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

/* Скролл без видимой полосы */
.expanded-scroll,
.side-scroll {
  scrollbar-width: none;
}

.expanded-scroll::-webkit-scrollbar,
.side-scroll::-webkit-scrollbar {
  display: none;
}
</style>
