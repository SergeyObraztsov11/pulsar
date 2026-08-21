<script setup lang="ts">
/**
 * TrackIndexCard — track row with index only (album tracklist).
 * Desktop + Mobile in one file; shared behavior via useTrackCard.
 */
import { PhDotsThree, PhHeart, PhPause, PhPlay } from "@phosphor-icons/vue";
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
  isLgUp,
  isCurrent,
  isLiked,
  isHovered,
  moreOpen,
  isPlayingCurrent,
  nameLabel,
  artistLabel,
  durationLabel,
  trackTo,
  artistTo,
  onPlayClick,
  toggleLike,
} = useTrackCard(() => props.track, { interactive: () => props.interactive });
</script>

<template>
  <!-- Desktop -->
  <TrackCardLayout
    class="hidden items-center transition-transform duration-200 hover:bg-primary-gray-dark motion-reduce:transform-none motion-reduce:transition-none lg:flex"
    :class="isCurrent ? 'bg-primary-gray-dark' : ''"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Index / play -->
    <div class="flex size-10 shrink-0 items-center justify-center">
      <span
        v-show="!interactive || (!isHovered && !isCurrent)"
        class="select-none font-semibold text-primary-gray"
      >
        {{ track?.trackNumber }}
      </span>

      <UiEqualizerIcon
        v-if="interactive"
        v-show="!isHovered && isCurrent"
        :active="isPlayingCurrent"
      />

      <button
        v-if="interactive"
        v-show="isHovered"
        type="button"
        class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
        @click="onPlayClick()"
      >
        <PhPause v-if="isPlayingCurrent" :size="16" weight="fill" />
        <PhPlay v-else :size="16" weight="fill" />
      </button>
    </div>

    <!-- Meta -->
    <div class="min-w-0 flex-1">
      <div class="truncate">
        <NuxtLink
          :to="trackTo"
          class="text-base font-medium text-primary-white hover:underline"
          @click.stop
        >
          {{ nameLabel }}
        </NuxtLink>
      </div>
      <div class="truncate">
        <NuxtLink
          :to="artistTo"
          class="text-sm text-primary-gray hover:underline"
          @click.stop
        >
          {{ artistLabel }}
        </NuxtLink>
      </div>
    </div>

    <!-- Actions: like + more (hover) / duration -->
    <div class="flex items-center justify-center gap-3">
      <button
        v-if="interactive"
        type="button"
        class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
        @click="toggleLike()"
      >
        <PhHeart :size="20" :weight="isLiked ? 'fill' : 'light'" />
      </button>

      <TrackMoreMenu
        v-if="interactive && isLgUp && (isHovered || moreOpen)"
        v-model:open="moreOpen"
        :is-playing-current="isPlayingCurrent"
        :is-liked="isLiked"
        @play="onPlayClick"
        @toggle-like="toggleLike"
      >
        <template #trigger>
          <button
            type="button"
            class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
          >
            <PhDotsThree :size="24" weight="light" />
          </button>
        </template>
      </TrackMoreMenu>

      <span
        v-else
        class="flex size-8 items-center justify-center text-sm text-primary-white select-none"
      >
        {{ durationLabel }}
      </span>
    </div>
  </TrackCardLayout>

  <!-- Mobile -->
  <TrackCardLayout
    class="flex items-center lg:hidden"
    :class="[
      isCurrent ? 'bg-primary-gray-dark' : '',
      interactive ? 'cursor-pointer' : '',
    ]"
    @click="interactive ? onPlayClick() : undefined"
  >
    <!-- Index -->
    <div class="flex size-10 shrink-0 items-center justify-center">
      <span
        v-show="!isCurrent"
        class="select-none font-semibold text-primary-gray"
      >
        {{ track?.trackNumber }}
      </span>
      <UiEqualizerIcon v-show="isCurrent" :active="isPlayingCurrent" />
    </div>

    <!-- Meta -->
    <div class="min-w-0 flex-1">
      <p class="truncate text-base font-medium text-primary-white">
        {{ nameLabel }}
      </p>
      <p class="truncate text-sm text-primary-gray">
        {{ artistLabel }}
      </p>
    </div>

    <!-- Actions: like + more / duration (stop — row click = play) -->
    <div class="flex items-center justify-center gap-3" @click.stop>
      <button
        v-if="interactive"
        type="button"
        class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
        @click="toggleLike()"
      >
        <PhHeart :size="20" :weight="isLiked ? 'fill' : 'light'" />
      </button>

      <TrackMoreMenu
        v-if="interactive && !isLgUp"
        v-model:open="moreOpen"
        :is-playing-current="isPlayingCurrent"
        :is-liked="isLiked"
        @play="onPlayClick"
        @toggle-like="toggleLike"
      >
        <template #trigger>
          <button
            type="button"
            class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
          >
            <PhDotsThree :size="24" weight="light" />
          </button>
        </template>
      </TrackMoreMenu>

      <span
        v-else
        class="flex size-8 items-center justify-center text-sm text-primary-white select-none"
      >
        {{ durationLabel }}
      </span>
    </div>
  </TrackCardLayout>
</template>
