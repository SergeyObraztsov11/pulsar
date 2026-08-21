<script setup lang="ts">
/**
 * AppPlayerExpandedDesktop — оболочка полноэкранного плеера.
 * Режимы правой панели: player | queue | lyrics.
 */
type SidePanel = "player" | "queue" | "lyrics";

const playerStore = usePlayerStore();

/** Режим правой колонки */
const sidePanel = ref<SidePanel>("queue");

const showSidePanel = computed(() => sidePanel.value !== "player");

/** Переключить панель; повторный клик по активной → только плеер */
function toggleSidePanel(panel: "queue" | "lyrics") {
  sidePanel.value = sidePanel.value === panel ? "player" : panel;
}

/** Скролл правой колонки: затемнение у краёв */
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

async function onSideContentChange() {
  await nextTick();
  updateSideFades();
}

watch(
  () => playerStore.isExpanded,
  async (open) => {
    if (!open) return;
    await nextTick();
    updateSideFades();
  },
);

watch(sidePanel, async (panel) => {
  if (panel === "player") {
    fadeTop.value = false;
    fadeBottom.value = false;
    return;
  }
  await nextTick();
  if (sideScrollRef.value) sideScrollRef.value.scrollTop = 0;
  updateSideFades();
});
</script>

<template>
  <Transition name="player-expand">
    <div
      v-if="playerStore.showPlayer && playerStore.isExpanded"
      class="absolute inset-0 z-50 flex flex-col overflow-hidden bg-primary-gray/25"
    >
      <!-- Chrome: очередь | текст | свернуть (выше контента, иначе клики не доходят) -->
      <div class="absolute top-6 right-6 z-20 flex items-center gap-2">
        <UiButton
          class="hidden lg:inline-flex"
          :variant="sidePanel === 'queue' ? 'white' : 'gray'"
          icon="Queue"
          aria-label="Очередь"
          @click="toggleSidePanel('queue')"
        />
        <UiButton
          class="hidden lg:inline-flex"
          :variant="sidePanel === 'lyrics' ? 'white' : 'gray'"
          icon="TextAlignLeft"
          aria-label="Текст"
          @click="toggleSidePanel('lyrics')"
        />
        <UiButton
          class="ml-2 scale-125"
          variant="gray"
          icon="CaretDown"
          aria-label="Свернуть"
          @click="playerStore.closeExpanded()"
        />
      </div>

      <!--
        Mobile: один вертикальный скролл.
        Desktop: две равные колонки; панель анимирует 0fr ↔ 1fr.
      -->
      <div
        class="expanded-scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:overflow-hidden lg:duration-500 lg:ease-out motion-reduce:lg:transition-none lg:transition-[grid-template-columns]"
        :class="
          showSidePanel
            ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
            : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]'
        "
      >
        <AppPlayerExpandedMain />

        <!--
          Правая колонка: снаружи overflow + анимация ширины.
          Внутри контент сразу на финальную ширину (~50vw).
        -->
        <div
          class="min-w-0 shrink-0 overflow-hidden transition-opacity duration-500 ease-out motion-reduce:transition-none lg:flex lg:min-h-0 lg:min-w-0 lg:flex-col"
          :class="
            showSidePanel
              ? 'lg:opacity-100'
              : 'lg:pointer-events-none lg:opacity-0'
          "
        >
          <div
            class="flex w-full flex-col px-8 pb-16 lg:h-full lg:min-h-0 lg:w-[50vw] lg:min-w-[50vw] lg:flex-1 lg:px-12 lg:py-16 lg:pr-20"
          >
            <div class="relative min-h-0 w-full flex-1">
              <div
                class="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-16 bg-linear-to-b from-primary-gray-dark to-transparent transition-opacity duration-200 lg:block"
                :class="fadeTop ? 'opacity-100' : 'opacity-0'"
              />
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-16 bg-linear-to-t from-primary-gray-dark to-transparent transition-opacity duration-200 lg:block"
                :class="fadeBottom ? 'opacity-100' : 'opacity-0'"
              />

              <div
                ref="sideScrollRef"
                class="side-scroll relative h-full overflow-y-auto"
                @scroll="updateSideFades"
              >
                <!-- Crossfade queue ↔ lyrics -->
                <Transition name="side-panel-fade" mode="out-in">
                  <AppPlayerExpandedQueue
                    v-if="sidePanel === 'queue'"
                    key="queue"
                  />
                  <AppPlayerExpandedLyrics
                    v-else-if="sidePanel === 'lyrics'"
                    key="lyrics"
                    @content-change="onSideContentChange"
                  />
                </Transition>
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
  transition: opacity 0.35s ease;
}

.player-expand-enter-from,
.player-expand-leave-to {
  opacity: 0;
}

/* Смена контента справа: очередь ↔ текст */
.side-panel-fade-enter-active,
.side-panel-fade-leave-active {
  transition: opacity 0.28s ease;
}

.side-panel-fade-enter-from,
.side-panel-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .player-expand-enter-active,
  .player-expand-leave-active,
  .side-panel-fade-enter-active,
  .side-panel-fade-leave-active {
    transition: none;
  }
}

.expanded-scroll,
.side-scroll {
  scrollbar-width: none;
}

.expanded-scroll::-webkit-scrollbar,
.side-scroll::-webkit-scrollbar {
  display: none;
}
</style>
