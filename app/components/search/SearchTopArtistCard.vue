<script setup lang="ts">
/**
 * SearchTopArtistCard — топ-артист на /search: аватар, meta, like, play.
 */
import { PhHeart, PhPause, PhPlay, PhUser } from "@phosphor-icons/vue";
import type { Artist } from "~/types/artist";

const props = defineProps<{
  artist: Artist;
}>();

const {
  isLiked,
  isPlaying,
  playPending,
  artistTo,
  nameLabel,
  onPlayClick,
  toggleLike,
} = useArtistCard(() => props.artist);
</script>

<template>
  <!-- Топ-карточка артиста -->
  <div
    class="flex min-w-0 items-center gap-4 rounded-lg bg-tone-surface p-4 sm:gap-6 sm:p-5"
  >
    <NuxtLink
      :to="artistTo"
      class="size-20 shrink-0 overflow-hidden rounded-full bg-tone-surface-hover sm:size-28"
      :aria-label="nameLabel"
    >
      <UiCoverImage
        :src="artist.avatarSrc"
        :alt="nameLabel"
        :icon="PhUser"
      />
    </NuxtLink>

    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <NuxtLink
        :to="artistTo"
        class="truncate text-2xl font-bold leading-none text-tone-white hover:text-tone-muted sm:text-3xl"
      >
        {{ nameLabel }}
      </NuxtLink>
      <p class="text-sm leading-none text-tone-muted">Исполнитель</p>
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
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] disabled:opacity-40 motion-reduce:transform-none motion-reduce:hover:scale-100 sm:size-14"
        :disabled="playPending"
        :aria-label="isPlaying ? 'Пауза' : 'Слушать'"
        @click="onPlayClick"
      >
        <PhPause v-if="isPlaying" :size="28" weight="fill" />
        <PhPlay v-else :size="28" weight="fill" />
      </button>
    </div>
  </div>
</template>
