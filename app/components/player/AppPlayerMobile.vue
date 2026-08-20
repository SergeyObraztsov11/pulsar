<script setup lang="ts">
/**
 * AppPlayerMobile — мини-плеер (ниже lg).
 * Плавающий блок: мета слева, like + play справа (без UiButton).
 */
import { PhDisc, PhHeart, PhPause, PhPlay } from "@phosphor-icons/vue";

const playerStore = usePlayerStore();
const isLiked = ref(false);

/** Лайк текущего трека */
function toggleLike() {
  isLiked.value = !isLiked.value;
}
</script>

<template>
  <div
    class="relative mx-4 flex h-20 items-center gap-4 rounded-2xl border border-primary-gray-dark bg-primary-black p-3 lg:hidden"
  >
    <div
      class="size-14 shrink-0 overflow-hidden rounded-md bg-primary-gray-dark"
    >
      <UiCoverImage :icon="PhDisc" :icon-size="56" />
    </div>

    <div class="min-w-0 flex-1 leading-tight">
      <p class="truncate text-base font-medium text-primary-white">
        Track title
      </p>
      <p class="truncate text-sm text-primary-gray">Artist name</p>
    </div>

    <button
      type="button"
      class="flex items-center justify-center"
      @click="toggleLike()"
    >
      <PhHeart :size="28" :weight="isLiked ? 'fill' : 'light'" />
    </button>

    <button
      type="button"
      class="flex items-center justify-center"
      @click="playerStore.togglePlaying()"
    >
      <PhPause v-if="playerStore.isPlaying" :size="28" weight="fill" />
      <PhPlay v-else :size="28" weight="fill" />
    </button>
  </div>
</template>
