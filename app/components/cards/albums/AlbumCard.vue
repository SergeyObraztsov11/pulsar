<script setup lang="ts">
/**
 * AlbumCard — обложка, play на hover, more у названия.
 */
import { PhDotsThree, PhPause, PhPlay } from "@phosphor-icons/vue";
import type { Album } from "./albumCard.types";

const props = withDefaults(
  defineProps<{
    /** false — без play / more (guest) */
    interactive?: boolean;
    /** false — только название (полка одного артиста) */
    showArtist?: boolean;
    album: Album;
  }>(),
  { interactive: true, showArtist: true },
);

const {
  interactive,
  album,
  isLgUp,
  albumTo,
  artistTo,
  isLiked,
  moreOpen,
  isPlaying,
  playPending,
  nameLabel,
  artistLabel,
  onPlayClick,
  toggleLike,
  openShare,
  openReport,
  goToAlbum,
  goToArtist,
} = useAlbumCard(() => props.album, {
  interactive: () => props.interactive,
});
</script>

<template>
  <div
    class="group flex w-48 shrink-0 flex-col gap-2 rounded-md p-2 lg:hover:bg-tone-surface"
  >
    <div
      class="relative size-44 shrink-0 overflow-hidden rounded-md bg-tone-surface-hover"
    >
      <UiCoverImage :src="album?.coverSrc" />
      <NuxtLink
        :to="albumTo"
        class="absolute inset-0"
        :aria-label="nameLabel"
      />

      <button
        v-if="interactive"
        type="button"
        class="absolute bottom-3 left-3 z-10 hidden size-14 items-center justify-center rounded-full bg-tone-white text-tone-canvas opacity-0 transition-[transform,opacity] duration-200 group-hover:opacity-100 hover:scale-105 active:scale-95 lg:flex motion-reduce:transform-none"
        :disabled="playPending"
        :aria-label="isPlaying ? 'Пауза' : 'Слушать'"
        @click.stop="onPlayClick()"
      >
        <PhPause v-if="isPlaying" :size="28" weight="fill" />
        <PhPlay v-else :size="28" weight="fill" />
      </button>
    </div>

    <div class="flex min-w-0 flex-col">
      <div class="flex min-w-0 items-center gap-1">
        <NuxtLink
          :to="albumTo"
          class="min-w-0 flex-1 truncate text-base font-medium text-tone-white hover:text-tone-muted"
        >
          {{ nameLabel }}
        </NuxtLink>

        <AlbumMoreMenu
          v-if="interactive && isLgUp"
          v-model:open="moreOpen"
          :is-liked="isLiked"
          :is-playing="isPlaying"
          @play="onPlayClick"
          @toggle-like="toggleLike"
          @go-album="goToAlbum"
          @go-artist="goToArtist"
          @share="openShare"
          @report="openReport"
        >
          <template #trigger>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center text-tone-muted hover:text-tone-white"
              aria-label="Ещё"
            >
              <PhDotsThree :size="20" weight="bold" />
            </button>
          </template>
        </AlbumMoreMenu>
      </div>

      <NuxtLink
        v-if="props.showArtist"
        :to="artistTo"
        class="truncate text-sm text-tone-white hover:text-tone-white"
      >
        {{ artistLabel }}
      </NuxtLink>
    </div>
  </div>
</template>
