<script setup lang="ts">
/**
 * Строка лайкнутого артиста в боковой библиотеке.
 */
import { PhUser } from "@phosphor-icons/vue";
import type { Artist } from "~/types/artist";
import { artistPath } from "~/utils/catalogPaths";

const props = defineProps<{
  artist: Artist;
  active?: boolean;
}>();

const to = computed(() => artistPath(props.artist));
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex min-w-0 items-center gap-3 rounded-md p-2 transition-colors duration-200 hover:bg-tone-surface motion-reduce:transition-none"
    :class="active ? 'bg-tone-surface' : null"
  >
    <div class="size-12 shrink-0 overflow-hidden rounded-full bg-tone-surface">
      <UiCoverImage
        :src="artist.avatarSrc"
        :icon="PhUser"
        :alt="artist.name"
      />
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-base font-medium">{{ artist.name }}</p>
      <p class="truncate text-sm text-tone-muted">Исполнитель</p>
    </div>
  </NuxtLink>
</template>
