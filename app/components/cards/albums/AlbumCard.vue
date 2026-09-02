<script setup lang="ts">
/**
 * AlbumCard — album cover card.
 * Desktop + Mobile in one file; shared behavior via useAlbumCard.
 */
import {
  PhDotsThree,
  PhPause,
  PhPlay,
  PhPlusSquare,
} from "@phosphor-icons/vue";
import type { Album } from "./albumCard.types";

const props = withDefaults(
  defineProps<{
    /** false — preview without play / like / more (guest) */
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
        <!-- Действия: ряд снизу слева -->
        <div
          class="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
          :class="showDesktopActions ? 'opacity-100' : ''"
        >
          <div
            class="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-3"
          >
            <button
              type="button"
              class="flex size-12 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:hover:scale-100"
              :disabled="playPending"
              :aria-label="isPlaying ? 'Пауза' : 'Слушать'"
              @click.stop="onPlayClick()"
            >
              <PhPause v-if="isPlaying" :size="24" weight="fill" />
              <PhPlay v-else :size="24" weight="fill" />
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-tone-surface text-tone-white transition-colors duration-200 hover:bg-tone-surface-hover"
                :aria-label="isLiked ? 'Убрать из избранного' : 'В избранное'"
                :aria-pressed="isLiked"
                @click.stop="toggleLike()"
              >
                <PhPlusSquare
                  :size="20"
                  :weight="isLiked ? 'fill' : 'regular'"
                />
              </button>

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
                  <button
                    type="button"
                    class="flex size-9 shrink-0 items-center justify-center rounded-full bg-tone-surface text-tone-white transition-colors duration-200 hover:bg-tone-surface-hover"
                    aria-label="Ещё"
                  >
                    <PhDotsThree :size="20" weight="bold" />
                  </button>
                </template>
              </AlbumMoreMenu>
            </div>
          </div>
        </div>
      </template>
    </template>

    <template #meta>
      <NuxtLink
        :to="albumTo"
        class="min-w-0 truncate text-base font-medium text-tone-white transition-colors duration-300 hover:text-tone-muted"
      >
        {{ nameLabel }}
      </NuxtLink>
      <NuxtLink
        v-if="props.showArtist"
        :to="artistTo"
        class="truncate text-sm text-tone-muted transition-colors duration-300 hover:text-tone-white"
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
        class="min-w-0 truncate text-base font-medium text-tone-white transition-colors duration-300 hover:text-tone-muted"
      >
        {{ nameLabel }}
      </NuxtLink>
      <NuxtLink
        v-if="props.showArtist"
        :to="artistTo"
        class="truncate text-sm text-tone-muted transition-colors duration-300 hover:text-tone-white"
      >
        {{ artistLabel }}
      </NuxtLink>
    </template>
  </AlbumCardLayout>
</template>
