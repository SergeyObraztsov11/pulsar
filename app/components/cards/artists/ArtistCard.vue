<script setup lang="ts">
/**
 * ArtistCard — artist avatar card.
 * Desktop + Mobile in one file; shared behavior via useArtistCard.
 */
import { PhUser } from "@phosphor-icons/vue";
import type { Artist } from "./artistCard.types";

const props = withDefaults(
  defineProps<{
    /** false — preview without play / like / more (guest) */
    interactive?: boolean;
    artist: Artist;
  }>(),
  { interactive: true },
);

const {
  interactive,
  artist,
  isLgUp,
  artistTo,
  isLiked,
  moreOpen,
  nameLabel,
  showDesktopActions,
  onPlayClick,
  toggleLike,
  goToArtist,
} = useArtistCard(() => props.artist, {
  interactive: () => props.interactive,
});
</script>

<template>
  <!-- Desktop -->
  <ArtistCardLayout class="group hidden lg:flex">
    <template #avatar>
      <div
        class="absolute inset-0 overflow-hidden rounded-full bg-primary-gray-dark"
      >
        <UiCoverImage :src="artist?.avatarSrc" :icon="PhUser" />

        <div
          v-if="interactive"
          class="pointer-events-none absolute inset-0 bg-primary-black/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          :class="showDesktopActions ? 'opacity-100' : ''"
        />
      </div>

      <!-- Клик по аватару → исполнитель -->
      <NuxtLink
        :to="artistTo"
        class="absolute inset-0 rounded-full"
        :aria-label="nameLabel"
      />

      <div
        v-if="interactive"
        class="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
        :class="showDesktopActions ? 'opacity-100' : ''"
      >
        <div class="pointer-events-auto absolute top-3 right-3">
          <ArtistMoreMenu
            v-if="isLgUp"
            v-model:open="moreOpen"
            :is-liked="isLiked"
            @play="onPlayClick"
            @toggle-like="toggleLike"
            @go-artist="goToArtist"
          >
            <template #trigger>
              <UiButton variant="gray" icon="DotsThree" aria-label="Ещё" />
            </template>
          </ArtistMoreMenu>
        </div>
        <UiButton
          class="pointer-events-auto absolute bottom-3 left-3"
          icon="Play"
          filled
          aria-label="Слушать"
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

    <template #meta>
      <NuxtLink
        :to="artistTo"
        class="truncate text-base font-medium text-primary-white transition-colors duration-300 hover:underline"
      >
        {{ nameLabel }}
      </NuxtLink>
    </template>
  </ArtistCardLayout>

  <!-- Mobile -->
  <ArtistCardLayout class="group flex lg:hidden">
    <template #avatar>
      <div
        class="absolute inset-0 overflow-hidden rounded-full bg-primary-gray-dark"
      >
        <UiCoverImage :src="artist?.avatarSrc" :icon="PhUser" />
      </div>

      <!-- Тап по аватару → исполнитель -->
      <NuxtLink :to="artistTo" class="absolute inset-0 z-10 rounded-full" />
    </template>

    <template #meta>
      <NuxtLink
        :to="artistTo"
        class="truncate text-base font-medium text-primary-white transition-colors duration-300 hover:underline"
      >
        {{ nameLabel }}
      </NuxtLink>
    </template>
  </ArtistCardLayout>
</template>
