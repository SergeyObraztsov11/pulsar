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

const card = reactive(
  useTrackCard(() => props.track, {
    interactive: () => props.interactive,
  }),
);
</script>

<template>
  <TrackCardLayout
    class="flex items-center lg:transition-colors lg:duration-200 lg:hover:bg-tone-surface lg:motion-reduce:transition-none"
    :class="[
      card.isCurrent ? 'bg-tone-surface' : null,
      props.interactive ? 'max-lg:cursor-pointer' : null,
    ]"
    @mouseenter="card.isHovered = true"
    @mouseleave="card.isHovered = false"
    @click="card.onRowClick"
  >
    <!-- Index / play -->
    <div class="flex size-10 shrink-0 items-center justify-center">
      <span
        v-show="card.showTrackNumber"
        class="select-none text-sm font-semibold text-tone-white"
      >
        {{ card.track?.trackNumber }}
      </span>

      <UiEqualizerIcon
        v-if="props.interactive"
        v-show="card.showIndexEqualizer"
        :active="card.isPlayingCurrent"
      />

      <button
        v-if="card.showIndexPlay"
        type="button"
        class="flex size-8 items-center justify-center text-tone-white transition-colors duration-150 hover:text-tone-muted"
        @click.stop="card.onPlayClick()"
      >
        <PhPause v-if="card.isPlayingCurrent" :size="16" weight="fill" />
        <PhPlay v-else :size="16" weight="fill" />
      </button>
    </div>

    <TrackCardMeta
      :name-label="card.nameLabel"
      :artist-label="card.artistLabel"
      :track-to="card.trackTo"
      :artist-to="card.artistTo"
    />

    <TrackCardActions
      v-model:open="card.moreOpen"
      :interactive="props.interactive"
      :track-id="card.trackId ?? ''"
      :album-to="card.albumTo"
      :artist-to="card.artistTo"
      :is-playing-current="card.isPlayingCurrent"
      :is-liked="card.isLiked"
      :is-explicit="card.isExplicit"
      :duration-label="card.durationLabel"
      @play="card.onPlayClick"
      @toggle-like="card.toggleLike"
    />
  </TrackCardLayout>
</template>
