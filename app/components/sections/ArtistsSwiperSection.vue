<script setup lang="ts">
/**
 * ArtistsSwiperSection — горизонтальный swiper артистов (free-mode + скелетоны).
 * items nullish → скелетоны; [] → пусто.
 */
import type { Swiper as SwiperInstance } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import type { Artist } from "~/types/artist";

const props = withDefaults(
  defineProps<{
    items?: Artist[] | null;
    interactive?: boolean;
    skeletonCount?: number;
    limit?: number;
    /** Заголовок полки; без него — только лента */
    title?: string;
    /** Подзаголовок под title */
    description?: string;
    /** Заголовок как ссылка */
    to?: string;
  }>(),
  {
    interactive: true,
    skeletonCount: 6,
  },
);

const isLoading = computed(() => props.items == null);

const visibleItems = computed(() => {
  if (!props.items) return [];
  return props.limit != null ? props.items.slice(0, props.limit) : props.items;
});

const swiperInstance = ref<SwiperInstance | null>(null);
const isBeginning = ref(true);
const isEnd = ref(true);

function syncNav(swiper: SwiperInstance) {
  isBeginning.value = swiper.isBeginning;
  isEnd.value = swiper.isEnd;
}

function onSwiper(swiper: SwiperInstance) {
  swiperInstance.value = swiper;
  syncNav(swiper);
}

function onSlideChange(swiper: SwiperInstance) {
  syncNav(swiper);
}

function slidePrev() {
  swiperInstance.value?.slidePrev();
}

function slideNext() {
  swiperInstance.value?.slideNext();
}
</script>

<template>
  <!-- Artists shelf -->
  <section class="flex flex-col gap-6">
    <!-- Header -->
    <div v-if="props.title" class="flex items-end justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-2">
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

      <!-- Swiper prev / next -->
      <div class="flex shrink-0 items-center gap-2">
        <UiButton
          variant="outline"
          icon="CaretLeft"
          aria-label="Previous"
          :disabled="isBeginning || isLoading"
          @click="slidePrev"
        />
        <UiButton
          variant="outline"
          icon="CaretRight"
          aria-label="Next"
          :disabled="isEnd || isLoading"
          @click="slideNext"
        />
      </div>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-row flex-nowrap gap-6 overflow-hidden"
    >
      <ArtistCardSkeleton v-for="n in props.skeletonCount" :key="n" />
    </div>

    <div
      v-else
      class="artists-shelf w-full"
      :class="{
        'artists-shelf--fade-left': !isBeginning,
        'artists-shelf--fade-right': !isEnd,
      }"
    >
      <ClientOnly>
        <Swiper
          :modules="[FreeMode]"
          :slides-per-view="'auto'"
          :space-between="24"
          :watch-overflow="true"
          :free-mode="{ enabled: true, momentum: true, sticky: false }"
          class="artists-shelf__slider w-full"
          @swiper="onSwiper"
          @slide-change="onSlideChange"
          @progress="onSlideChange"
          @reach-beginning="onSlideChange"
          @reach-end="onSlideChange"
          @from-edge="onSlideChange"
        >
          <SwiperSlide
            v-for="artist in visibleItems"
            :key="artist.id"
            class="w-48! shrink-0"
          >
            <ArtistCard :artist="artist" :interactive="props.interactive" />
          </SwiperSlide>
        </Swiper>

        <!-- SSR / until hydrate -->
        <template #fallback>
          <div class="flex flex-row flex-nowrap gap-6 overflow-hidden">
            <ArtistCardSkeleton v-for="n in props.skeletonCount" :key="n" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </section>
</template>

<style scoped>
.artists-shelf {
  overflow: hidden;
}

.artists-shelf--fade-left {
  mask-image: linear-gradient(to right, transparent 0%, #000 10%, #000 100%);
}

.artists-shelf--fade-right {
  mask-image: linear-gradient(to right, #000 0%, #000 90%, transparent 100%);
}

.artists-shelf--fade-left.artists-shelf--fade-right {
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    #000 10%,
    #000 90%,
    transparent 100%
  );
}

.artists-shelf__slider :deep(.swiper-wrapper) {
  display: flex;
  flex-direction: row;
}
</style>
