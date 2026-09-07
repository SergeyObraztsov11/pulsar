<script setup lang="ts">
/**
 * AppPlayerMobile — мини-плеер (ниже lg).
 * Мета + play; тап по карточке → expanded.
 * Без coverColor — всегда tone-surface.
 */
import { PhPause, PhPlay } from "@phosphor-icons/vue";

const playerStore = usePlayerStore();

/** Mini: есть трек и expanded закрыт */
const showMiniPlayer = computed(
  () => playerStore.showPlayer && !playerStore.isExpanded,
);

const track = computed(() => playerStore.current);

const nameLabel = computed(() => track.value?.name ?? "Трек");
const artistLabel = computed(() => track.value?.artist?.name ?? "Исполнитель");

function openExpanded() {
  playerStore.openExpanded();
}
</script>

<template>
  <Transition name="player-mini">
    <div
      v-if="showMiniPlayer"
      role="button"
      tabindex="0"
      class="relative flex h-16 w-full cursor-pointer items-center gap-3 overflow-hidden bg-tone-surface px-3 lg:hidden"
      aria-label="Развернуть плеер"
      @click="openExpanded"
      @keydown.enter.prevent="openExpanded"
      @keydown.space.prevent="openExpanded"
    >
      <div class="size-10 shrink-0 overflow-hidden bg-tone-canvas">
        <UiCoverImage
          :src="track?.album?.coverSrc"
          :alt="track?.album?.name"
        />
      </div>

      <div class="min-w-0 flex-1 leading-tight">
        <p class="truncate text-base font-medium text-tone-white">
          {{ nameLabel }}
        </p>
        <p class="truncate text-sm text-tone-muted">{{ artistLabel }}</p>
      </div>

      <button
        type="button"
        class="flex size-10 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-opacity duration-200 hover:opacity-90"
        :aria-label="playerStore.isPlaying ? 'Пауза' : 'Слушать'"
        @click.stop="playerStore.togglePlaying()"
      >
        <PhPause v-if="playerStore.isPlaying" :size="20" weight="fill" />
        <PhPlay v-else :size="20" weight="fill" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.player-mini-enter-active,
.player-mini-leave-active {
  transition: transform 0.35s ease;
}

.player-mini-enter-from,
.player-mini-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .player-mini-enter-active,
  .player-mini-leave-active {
    transition: none;
  }
}
</style>
