<script setup lang="ts">
/**
 * ArtistCard — аватар, play на hover, имя по центру.
 */
import { PhPause, PhPlay, PhUser } from "@phosphor-icons/vue";
import type { Artist } from "./artistCard.types";

const props = withDefaults(
  defineProps<{
    /** false — без play (guest) */
    interactive?: boolean;
    artist: Artist;
  }>(),
  { interactive: true },
);

const {
  interactive,
  artist,
  artistTo,
  isPlaying,
  playPending,
  nameLabel,
  onPlayClick,
} = useArtistCard(() => props.artist, {
  interactive: () => props.interactive,
});
</script>

<template>
  <div
    class="group flex w-48 shrink-0 flex-col gap-2 rounded p-2 lg:hover:bg-tone-surface"
  >
    <div class="relative size-44 shrink-0">
      <div
        class="relative size-full overflow-hidden rounded-full bg-tone-surface-hover"
      >
        <UiCoverImage :src="artist?.avatarSrc" :icon="PhUser" />
        <NuxtLink
          :to="artistTo"
          class="absolute inset-0"
          :aria-label="nameLabel"
        />
      </div>

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

    <NuxtLink
      :to="artistTo"
      class="block w-full truncate text-center text-base font-medium text-tone-white hover:text-tone-muted"
    >
      {{ nameLabel }}
    </NuxtLink>
  </div>
</template>
