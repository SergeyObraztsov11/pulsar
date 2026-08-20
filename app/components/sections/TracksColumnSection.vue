<script setup lang="ts">
/**
 * TracksColumnSection — колонка треков + теги-жанры под ней.
 * items nullish → скелетоны (колонка и теги).
 */
import type { Genre } from "~/types/genre";
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";

const props = withDefaults(
  defineProps<{
    items?: Track[] | null;
    /** Теги-жанры под лентой */
    title?: string;
    description?: string;
    /** Заголовок как ссылка */
    to?: string;
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
</script>

<template>
  <!-- Feed -->
  <section class="flex flex-col gap-6">
    <!-- Header -->
    <div v-if="props.title" class="flex min-w-0 flex-col gap-2">
      <NuxtLink
        v-if="props.to"
        :to="props.to"
        class="text-2xl font-bold text-primary-white transition-colors hover:underline"
      >
        {{ props.title }}
      </NuxtLink>
      <h2 v-else class="text-2xl font-bold text-primary-white">
        {{ props.title }}
      </h2>
      <p v-if="props.description" class="text-primary-gray">
        {{ props.description }}
      </p>
    </div>

    <TracksColumn
      :items="props.items"
      :variant="props.variant"
      :limit="props.limit"
      :interactive="props.interactive"
      :queue-source="props.queueSource"
    />
  </section>
</template>
