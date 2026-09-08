<script setup lang="ts">
/**
 * TracksColumnSection — колонка треков с заголовком.
 */
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";

const props = withDefaults(
  defineProps<{
    items?: Track[] | null;
    title?: string;
    description?: string;
    to?: string;
    moreTo?: string;
    moreLabel?: string;
    limit?: number;
    /** false — превью без play / like / more (guest) */
    interactive?: boolean;
    variant?: "index" | "cover";
    queueSource?: PlayerQueueSource | null;
  }>(),
  {
    variant: "cover",
    limit: 6,
    interactive: true,
  },
);

const columnItems = computed(() => {
  if (!props.items?.length) return [];
  return props.limit != null ? props.items.slice(0, props.limit) : props.items;
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <div
      v-if="props.title"
      class="flex min-w-0 items-end justify-between gap-4"
    >
      <div class="flex min-w-0 flex-col gap-2">
        <NuxtLink
          v-if="props.to"
          :to="props.to"
          class="text-2xl font-bold text-tone-white transition-colors hover:underline"
        >
          {{ props.title }}
        </NuxtLink>
        <h2 v-else class="text-2xl font-bold text-tone-white">
          {{ props.title }}
        </h2>
        <p v-if="props.description" class="text-tone-muted">
          {{ props.description }}
        </p>
      </div>
      <NuxtLink
        v-if="props.moreTo"
        :to="props.moreTo"
        class="shrink-0 text-sm font-medium text-tone-muted transition-colors hover:text-tone-white"
      >
        {{ props.moreLabel ?? "Показать все" }}
      </NuxtLink>
    </div>

    <TracksColumn
      :items="columnItems"
      :variant="props.variant"
      :interactive="props.interactive"
      :queue-source="props.queueSource"
    />
  </section>
</template>
