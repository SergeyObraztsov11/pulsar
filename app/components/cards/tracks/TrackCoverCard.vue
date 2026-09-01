<script setup lang="ts">
/**
 * TrackCoverCard — track row with cover only (shelves, queue, search).
 */
import { PhPause, PhPlay } from "@phosphor-icons/vue";
import type { Track } from "./trackCard.types";

const props = withDefaults(
  defineProps<{
    track: Track;
    /** false — preview without play / like (guest) */
    interactive?: boolean;
  }>(),
  { interactive: true },
);

const {
  interactive,
  isCurrent,
  isLiked,
  isHovered,
  moreOpen,
  isLgUp,
  isPlayingCurrent,
  showCoverOverlayPanel,
  showCoverEqualizer,
  showCoverPlay,
  nameLabel,
  artistLabel,
  durationLabel,
  trackTo,
  artistTo,
  albumTo,
  trackId,
  coverSrc,
  onRowClick,
  onPlayClick,
  toggleLike,
} = useTrackCard(() => props.track, { interactive: () => props.interactive });
</script>

<template>
  <TrackCardLayout
    class="flex items-center lg:transition-transform lg:duration-200 lg:hover:bg-primary-gray-dark lg:motion-reduce:transform-none lg:motion-reduce:transition-none"
    :class="[
      isCurrent ? 'bg-primary-gray-dark' : '',
      interactive && !isLgUp ? 'cursor-pointer' : '',
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="onRowClick"
  >
    <!-- Cover -->
    <div
      class="relative size-12 shrink-0 overflow-hidden rounded-md bg-primary-gray-dark"
    >
      <UiCoverImage :src="coverSrc" />

      <div
        v-if="interactive && showCoverOverlayPanel"
        class="absolute inset-0 flex items-center justify-center bg-primary-black/50"
      >
        <UiEqualizerIcon
          v-show="showCoverEqualizer"
          :active="isPlayingCurrent"
        />
        <button
          v-show="showCoverPlay"
          type="button"
          class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
          @click.stop="onPlayClick()"
        >
          <PhPause v-if="isPlayingCurrent" :size="16" weight="fill" />
          <PhPlay v-else :size="16" weight="fill" />
        </button>
      </div>
    </div>

    <TrackCardMeta
      :name-label="nameLabel"
      :artist-label="artistLabel"
      :track-to="trackTo"
      :artist-to="artistTo"
      :is-lg-up="isLgUp"
    />

    <TrackCardActions
      v-model:open="moreOpen"
      :interactive="interactive"
      :track-id="trackId ?? ''"
      :album-to="albumTo"
      :artist-to="artistTo"
      :is-playing-current="isPlayingCurrent"
      :is-liked="isLiked"
      :duration-label="durationLabel"
      @play="onPlayClick"
      @toggle-like="toggleLike"
    />
  </TrackCardLayout>
</template>
