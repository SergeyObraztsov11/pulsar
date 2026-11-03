<script setup lang="ts">
/**
 * PlaylistCard — playlist cover card (play + link to detail).
 */
import type { PlaylistSummary } from "./playlistCard.types";

const props = withDefaults(
  defineProps<{
    /** false — preview without play overlay */
    interactive?: boolean;
    playlist: PlaylistSummary;
  }>(),
  { interactive: true },
);

const {
  interactive,
  playlist,
  playlistTo,
  isPlaying,
  playPending,
  nameLabel,
  metaLabel,
  coverIcon,
  showDesktopActions,
  onPlayClick,
} = usePlaylistCard(() => props.playlist, {
  interactive: () => props.interactive,
});
</script>

<template>
  <!-- Desktop -->
  <PlaylistCardLayout class="group hidden lg:flex">
    <template #cover>
      <UiCoverImage
        :src="playlist?.coverSrc"
        :alt="nameLabel"
        :icon="coverIcon"
        :icon-size="40"
      />

      <NuxtLink :to="playlistTo" class="absolute inset-0" :aria-label="nameLabel" />

      <template v-if="interactive">
        <div
          class="pointer-events-none absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          :class="showDesktopActions ? 'opacity-100' : ''"
        />

        <div
          class="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
          :class="showDesktopActions ? 'opacity-100' : ''"
        >
          <UiButton
            class="pointer-events-auto absolute bottom-3 left-3"
            :variant="playPending ? 'loading' : 'white'"
            :icon="playPending ? undefined : isPlaying ? 'Pause' : 'Play'"
            filled
            :aria-label="isPlaying ? 'Пауза' : 'Слушать'"
            @click.stop="onPlayClick()"
          />
        </div>
      </template>
    </template>

    <template #meta>
      <NuxtLink
        :to="playlistTo"
        class="min-w-0 truncate text-base font-medium text-primary-white transition-colors duration-300"
      >
        {{ nameLabel }}
      </NuxtLink>
      <p class="truncate text-sm text-primary-gray">
        {{ metaLabel }}
      </p>
    </template>
  </PlaylistCardLayout>

  <!-- Mobile -->
  <PlaylistCardLayout class="group flex lg:hidden">
    <template #cover>
      <UiCoverImage
        :src="playlist?.coverSrc"
        :alt="nameLabel"
        :icon="coverIcon"
        :icon-size="40"
      />

      <NuxtLink :to="playlistTo" class="absolute inset-0 z-10" />
    </template>

    <template #meta>
      <NuxtLink
        :to="playlistTo"
        class="min-w-0 truncate text-base font-medium text-primary-white transition-colors duration-300"
      >
        {{ nameLabel }}
      </NuxtLink>
      <p class="truncate text-sm text-primary-gray">
        {{ metaLabel }}
      </p>
    </template>
  </PlaylistCardLayout>
</template>
