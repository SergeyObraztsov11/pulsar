<script setup lang="ts">
/**
 * AppPlayerMobile — мини-плеер (ниже lg).
 * Мета + like + play; тап по карточке → expanded.
 */
import { PhHeart, PhPause, PhPlay } from "@phosphor-icons/vue";

const playerStore = usePlayerStore();

/** Mini: есть трек и expanded закрыт */
const showMiniPlayer = computed(
  () => playerStore.showPlayer && !playerStore.isExpanded,
);

const track = computed(() => playerStore.current);

const nameLabel = computed(() => track.value?.name ?? "Трек");
const artistLabel = computed(() => track.value?.artist?.name ?? "Исполнитель");

const trackId = computed(() => track.value?.id);
const { isLiked, pending, toggleLike } = useLike("track", trackId, {
  initial: computed(() => track.value?.isLiked),
});

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
      class="relative mx-4 flex h-16 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-tone-surface bg-tone-surface px-3 lg:hidden"
      aria-label="Развернуть плеер"
      @click="openExpanded"
      @keydown.enter.prevent="openExpanded"
      @keydown.space.prevent="openExpanded"
    >
    <div
      class="size-10 shrink-0 overflow-hidden rounded-md bg-tone-canvas"
    >
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
      class="flex size-10 shrink-0 items-center justify-center text-tone-white disabled:opacity-40"
      :disabled="!track || pending"
      :aria-label="isLiked ? 'Убрать из любимых' : 'В любимое'"
      @click.stop="toggleLike()"
    >
      <PhHeart :size="20" :weight="isLiked ? 'fill' : 'light'" />
    </button>

    <button
      type="button"
      class="flex size-10 shrink-0 items-center justify-center text-tone-white"
      :aria-label="playerStore.isPlaying ? 'Пауза' : 'Слушать'"
      @click.stop="playerStore.togglePlaying()"
    >
      <PhPause v-if="playerStore.isPlaying" :size="20" weight="fill" />
      <PhPlay v-else :size="20" weight="fill" />
    </button>

    <!-- Тонкий прогресс у нижнего края карточки -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-tone-canvas"
      aria-hidden="true"
    >
      <div
        class="h-full bg-tone-white transition-[width] duration-100 ease-linear motion-reduce:transition-none"
        :style="{ width: `${playerStore.progressRatio * 100}%` }"
      />
    </div>
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
