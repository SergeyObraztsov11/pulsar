<script setup lang="ts">
/**
 * SearchAlbumSuggestRow — альбом в suggest: ссылка + like + more.
 */
import { PhDotsThree, PhHeart } from "@phosphor-icons/vue";
import type { Album } from "~/types/album";

const props = defineProps<{
  album: Album;
  active?: boolean;
}>();

const {
  isLiked,
  moreOpen,
  isPlaying,
  albumTo,
  nameLabel,
  artistLabel,
  onPlayClick,
  toggleLike,
  openShare,
  openReport,
  goToAlbum,
  goToArtist,
} = useAlbumCard(() => props.album);

const emit = defineEmits<{
  pick: [];
}>();
</script>

<template>
  <div
    class="group flex min-w-0 w-full flex-row items-center gap-3 p-2 text-tone-white transition-colors hover:bg-tone-surface-hover"
    :class="props.active ? 'bg-tone-surface-hover' : null"
    :aria-current="props.active ? 'true' : undefined"
  >
    <NuxtLink
      :to="albumTo"
      class="flex min-w-0 flex-1 items-center gap-3"
      @click="emit('pick')"
    >
      <div class="size-12 shrink-0 overflow-hidden rounded bg-tone-surface-hover">
        <UiCoverImage :src="album.coverSrc" :alt="nameLabel" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-base font-medium leading-none">{{ nameLabel }}</p>
        <p class="mt-1 truncate text-sm leading-none text-tone-muted">
          Альбом · {{ artistLabel }}
        </p>
      </div>
    </NuxtLink>

    <!-- mousedown.prevent — не сбрасывать фокус поля (иначе панель закроется) -->
    <div
      class="flex shrink-0 items-center gap-1"
      @click.stop
      @mousedown.prevent
    >
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center text-tone-white transition-colors hover:text-tone-muted"
        :aria-label="isLiked ? 'Убрать из любимого' : 'В любимое'"
        :aria-pressed="isLiked"
        @click="toggleLike"
      >
        <PhHeart :size="20" :weight="isLiked ? 'fill' : 'light'" />
      </button>

      <AlbumMoreMenu
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
            class="flex size-8 shrink-0 items-center justify-center text-tone-white transition-colors hover:text-tone-muted"
            aria-label="Ещё"
          >
            <PhDotsThree :size="20" weight="light" />
          </button>
        </template>
      </AlbumMoreMenu>
    </div>
  </div>
</template>
