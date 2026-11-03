<script setup lang="ts">
/**
 * TrackRankedCard — track row with rank number + cover (charts).
 */
import { PhPause, PhPlay } from "@phosphor-icons/vue";
import type { Track } from "./trackCard.types";

const props = withDefaults(
  defineProps<{
    track: Track;
    /** Chart position (1-based) */
    rank: number;
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
    <!-- Rank + cover -->
    <span
      class="flex w-6 shrink-0 select-none justify-center font-semibold text-tone-white"
    >
      {{ props.rank }}
    </span>
    <div
      class="relative size-12 shrink-0 overflow-hidden rounded-md bg-tone-surface"
    >
      <UiCoverImage :src="card.coverSrc" />

      <div
        v-if="props.interactive && card.showCoverOverlayPanel"
        class="absolute inset-0 flex items-center justify-center bg-black/50"
      >
        <UiEqualizerIcon
          v-show="card.showCoverEqualizer"
          :active="card.isPlayingCurrent"
        />
        <button
          v-show="card.showCoverPlay"
          type="button"
          class="flex size-8 items-center justify-center text-white transition-colors duration-150"
          @click.stop="card.onPlayClick()"
        >
          <PhPause v-if="card.isPlayingCurrent" :size="16" weight="fill" />
          <PhPlay v-else :size="16" weight="fill" />
        </button>
      </div>
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
