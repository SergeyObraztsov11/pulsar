<script setup lang="ts">
/**
 * SearchTopTrackCard — топ-трек на /search (ссылка на альбом).
 */
import { PhHeart, PhPause, PhPlay } from "@phosphor-icons/vue";
import type { Track } from "~/types/track";

const props = defineProps<{
  track: Track;
}>();

const {
  isLiked,
  isPlayingCurrent,
  albumTo,
  nameLabel,
  artistLabel,
  coverSrc,
  onPlayClick,
  toggleLike,
} = useTrackCard(() => props.track);
</script>

<template>
  <div
    class="flex min-w-0 items-center gap-4 rounded-lg bg-tone-surface p-4 sm:gap-6 sm:p-5"
  >
    <NuxtLink
      :to="albumTo"
      class="size-20 shrink-0 overflow-hidden rounded-md bg-tone-surface-hover sm:size-28"
      :aria-label="nameLabel"
    >
      <UiCoverImage :src="coverSrc" :alt="nameLabel" />
    </NuxtLink>

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <NuxtLink
        :to="albumTo"
        class="truncate text-2xl font-bold leading-none text-tone-white hover:text-tone-muted sm:text-3xl"
      >
        {{ nameLabel }}
      </NuxtLink>
      <p class="truncate text-sm leading-none text-tone-muted">
        Трек · {{ artistLabel }}
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <button
        type="button"
        class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors hover:text-tone-muted sm:size-12"
        :aria-label="isLiked ? 'Убрать из любимого' : 'В любимое'"
        :aria-pressed="isLiked"
        @click="toggleLike"
      >
        <PhHeart :size="28" :weight="isLiked ? 'fill' : 'light'" />
      </button>

      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none motion-reduce:hover:scale-100 sm:size-14"
        :aria-label="isPlayingCurrent ? 'Пауза' : 'Слушать'"
        @click="onPlayClick"
      >
        <PhPause v-if="isPlayingCurrent" :size="28" weight="fill" />
        <PhPlay v-else :size="28" weight="fill" />
      </button>
    </div>
  </div>
</template>
