<script setup lang="ts">
/**
 * TrackCardActions — explicit, duration, like, more menu.
 */
import { PhDotsThree, PhHeart } from "@phosphor-icons/vue";

withDefaults(
  defineProps<{
    interactive?: boolean;
    trackId: string;
    albumTo: string;
    artistTo: string;
    isPlayingCurrent: boolean;
    isLiked: boolean;
    isExplicit?: boolean;
    durationLabel?: string;
  }>(),
  {
    interactive: true,
    isExplicit: false,
    durationLabel: "",
  },
);

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  play: [];
  "toggle-like": [];
}>();
</script>

<template>
  <div class="flex shrink-0 items-center gap-2" @click.stop>
    <span
      class="inline-flex size-10 shrink-0 items-center justify-center text-xs leading-none tabular-nums text-tone-white select-none"
    >
      {{ durationLabel }}
    </span>

    <button
      v-if="interactive"
      type="button"
      class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted"
      @click="emit('toggle-like')"
    >
      <PhHeart :size="24" :weight="isLiked ? 'fill' : 'light'" />
    </button>

    <TrackMoreMenu
      v-if="interactive"
      v-model:open="open"
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
          class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted"
        >
          <PhDotsThree :size="24" weight="light" />
        </button>
      </template>
    </TrackMoreMenu>
  </div>
</template>
