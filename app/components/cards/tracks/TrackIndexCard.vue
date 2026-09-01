<script setup lang="ts">
/**
 * TrackIndexCard — track row with index (album tracklist).
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
  track,
  isCurrent,
  isLiked,
  isHovered,
  moreOpen,
  isLgUp,
  isPlayingCurrent,
  showTrackNumber,
  showIndexEqualizer,
  showIndexPlay,
  nameLabel,
  artistLabel,
  durationLabel,
  trackTo,
  artistTo,
  albumTo,
  trackId,
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
    <!-- Index / play -->
    <div class="flex size-10 shrink-0 items-center justify-center">
      <span
        v-show="showTrackNumber"
        class="select-none text-sm font-semibold text-primary-gray"
      >
        {{ track?.trackNumber }}
      </span>

      <UiEqualizerIcon
        v-if="interactive"
        v-show="showIndexEqualizer"
        :active="isPlayingCurrent"
      />

      <button
        v-if="showIndexPlay"
        type="button"
        class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
        @click.stop="onPlayClick()"
      >
        <PhPause v-if="isPlayingCurrent" :size="16" weight="fill" />
        <PhPlay v-else :size="16" weight="fill" />
      </button>
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
