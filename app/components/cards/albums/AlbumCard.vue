<script setup lang="ts">
/**
 * AlbumCard — album cover card.
 * Desktop + Mobile in one file; shared behavior via useAlbumCard.
 */
import type { Album } from "./albumCard.types";

const props = withDefaults(
  defineProps<{
    /** false — preview without play / like / more (guest) */
    interactive?: boolean;
    album: Album;
  }>(),
  { interactive: true },
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
  showDesktopActions,
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
  <!-- Desktop -->
  <AlbumCardLayout class="group hidden lg:flex">
    <template #cover>
      <UiCoverImage :src="album?.coverSrc" />

      <!-- Клик по обложке → альбом -->
      <NuxtLink :to="albumTo" class="absolute inset-0" :aria-label="nameLabel" />

      <template v-if="interactive">
        <!-- Затемнение — без перехвата кликов -->
        <div
          class="pointer-events-none absolute inset-0 bg-primary-black/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          :class="showDesktopActions ? 'opacity-100' : ''"
        />

        <!-- Действия: клики только у кнопок -->
        <div
          class="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
          :class="showDesktopActions ? 'opacity-100' : ''"
        >
          <div class="pointer-events-auto absolute top-3 right-3">
            <AlbumMoreMenu
              v-if="isLgUp"
              v-model:open="moreOpen"
              :is-liked="isLiked"
              @play="onPlayClick"
              @toggle-like="toggleLike"
              @go-album="goToAlbum"
              @go-artist="goToArtist"
              @share="openShare"
              @report="openReport"
            >
              <template #trigger>
                <UiButton variant="gray" icon="DotsThree" aria-label="Ещё" />
              </template>
            </AlbumMoreMenu>
          </div>

          <UiButton
            class="pointer-events-auto absolute bottom-3 left-3"
            :variant="playPending ? 'loading' : 'white'"
            :icon="playPending ? undefined : isPlaying ? 'Pause' : 'Play'"
            filled
            :aria-label="isPlaying ? 'Пауза' : 'Слушать'"
            @click.stop="onPlayClick()"
          />

          <UiButton
            class="pointer-events-auto absolute bottom-3 right-3"
            variant="gray"
            icon="Heart"
            :filled="isLiked"
            :aria-label="isLiked ? 'Убрать из избранного' : 'В избранное'"
            @click.stop="toggleLike()"
          />
        </div>
      </template>
    </template>

    <template #meta>
      <NuxtLink
        :to="albumTo"
        class="truncate text-base font-medium text-primary-white transition-colors duration-300 hover:underline"
      >
        {{ nameLabel }}
      </NuxtLink>
      <NuxtLink
        :to="artistTo"
        class="truncate text-sm text-primary-gray transition-colors duration-300 hover:underline"
      >
        {{ artistLabel }}
      </NuxtLink>
    </template>
  </AlbumCardLayout>

  <!-- Mobile -->
  <AlbumCardLayout class="group flex lg:hidden">
    <template #cover>
      <UiCoverImage :src="album?.coverSrc" />

      <!-- Тап по обложке → альбом -->
      <NuxtLink :to="albumTo" class="absolute inset-0 z-10" />
    </template>

    <template #meta>
      <NuxtLink
        :to="albumTo"
        class="truncate text-base font-medium text-primary-white transition-colors duration-300 hover:underline"
      >
        {{ nameLabel }}
      </NuxtLink>
      <NuxtLink
        :to="artistTo"
        class="truncate text-sm text-primary-gray transition-colors duration-300 hover:underline"
      >
        {{ artistLabel }}
      </NuxtLink>
    </template>
  </AlbumCardLayout>
</template>
