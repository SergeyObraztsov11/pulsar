<script setup lang="ts">
/**
 * TrackCardActions — duration, like, more menu.
 */
import { PhDotsThree, PhHeart } from "@phosphor-icons/vue";

defineProps<{
  interactive: boolean;
  trackId: string;
  albumTo: string;
  artistTo: string;
  isPlayingCurrent: boolean;
  isLiked: boolean;
  durationLabel: string;
}>();

const moreOpen = defineModel<boolean>("moreOpen", { default: false });

const emit = defineEmits<{
  play: [];
  "toggle-like": [];
}>();
</script>

<template>
  <div class="flex items-center justify-center gap-3" @click.stop>
    <span
      class="flex min-w-8 items-center justify-center text-xs tabular-nums text-primary-gray select-none"
    >
      {{ durationLabel }}
    </span>

    <button
      v-if="interactive"
      type="button"
      class="flex size-8 items-center justify-center text-primary-white transition-colors duration-150"
      @click="emit('toggle-like')"
    >
      <PhHeart :size="20" :weight="isLiked ? 'fill' : 'light'" />
    </button>

    <TrackMoreMenu
      v-if="interactive"
      v-model:open="moreOpen"
      :track-id="trackId"
      :album-to="albumTo"
      :artist-to="artistTo"
      :is-playing-current="isPlayingCurrent"
      :is-liked="isLiked"
      @play="emit('play')"
      @toggle-like="emit('toggle-like')"
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
  </div>
</template>
