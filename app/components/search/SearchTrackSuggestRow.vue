<script setup lang="ts">
/**
 * SearchTrackSuggestRow — трек в suggest: ссылка + like + more.
 */
import { PhDotsThree, PhHeart } from "@phosphor-icons/vue";
import type { Track } from "~/types/track";

const props = defineProps<{
  track: Track;
  active?: boolean;
}>();

const {
  isLiked,
  moreOpen,
  isPlayingCurrent,
  trackId,
  albumTo,
  artistTo,
  nameLabel,
  artistLabel,
  coverSrc,
  onPlayClick,
  toggleLike,
} = useTrackCard(() => props.track);

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
        <UiCoverImage :src="coverSrc" :alt="nameLabel" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-base font-medium leading-none">{{ nameLabel }}</p>
        <p class="mt-1 truncate text-sm leading-none text-tone-muted">
          Трек · {{ artistLabel }}
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

      <TrackMoreMenu
        v-model:open="moreOpen"
        :track-id="trackId ?? ''"
        :album-to="albumTo"
        :artist-to="artistTo"
        :is-playing-current="isPlayingCurrent"
        :is-liked="isLiked"
        @play="onPlayClick"
        @toggle-like="toggleLike"
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
      </TrackMoreMenu>
    </div>
  </div>
</template>
