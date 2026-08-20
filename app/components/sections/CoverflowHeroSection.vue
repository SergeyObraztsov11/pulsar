<script setup lang="ts">
/**
 * CoverflowHeroSection — hero лендинга: копирайт слева, coverflow обложек справа.
 * items nullish → скелетоны вместо свайпера.
 */
import { EffectCoverflow, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import "swiper/css/effect-coverflow";
import type { Album } from "~/types/album";

const props = withDefaults(
  defineProps<{
    items?: Album[] | null;
    limit?: number;
  }>(),
  {
    limit: 7,
  },
);

const isLoading = computed(() => props.items == null);

const visibleItems = computed(() => {
  if (!props.items) return [];
  return props.items.slice(0, props.limit);
});

/** Стартуем с центральной обложки */
const initialSlide = computed(() => Math.floor(visibleItems.value.length / 2));

const canLoop = computed(() => visibleItems.value.length >= 4);

const prefersReducedMotion = ref(false);

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
});

const autoplay = computed(() => {
  if (prefersReducedMotion.value || !canLoop.value) return false;
  return {
    delay: 2800,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  };
});
</script>

<template>
  <!-- Landing hero -->
  <section
    class="flex flex-col gap-10 lg:min-h-96 lg:flex-row lg:items-center lg:gap-12"
  >
    <!-- Hero copy -->
    <div class="flex max-w-xl shrink-0 flex-col gap-6 lg:w-[46%]">
      <h1
        class="flex flex-col gap-1 text-4xl font-bold leading-none text-primary-white sm:text-5xl"
      >
        <span>Открывай</span>
        <span>Стань открытием</span>
      </h1>
      <p class="text-xl text-primary-white">
        Здесь слушатели и артисты находят друг друга
      </p>
    </div>

    <!-- Coverflow + glow + CTA -->
    <div class="flex min-w-0 flex-1 flex-col items-center gap-6">
      <div class="relative w-full">
        <div
          class="absolute top-1/2 left-1/2 size-64 rounded-full bg-accent/20 blur-3xl animate-glow-breathe motion-reduce:animate-none lg:size-72"
        />

        <!-- Скелетоны: центр + два крыла -->
        <div
          v-if="isLoading"
          class="relative z-10 flex w-full items-center justify-center gap-4 py-8"
        >
          <div
            class="size-32 shrink-0 animate-pulse rounded-md bg-primary-gray-dark opacity-40 sm:size-40"
          />
          <div
            class="size-44 shrink-0 animate-pulse rounded-md bg-primary-gray-dark sm:size-52"
          />
          <div
            class="size-32 shrink-0 animate-pulse rounded-md bg-primary-gray-dark opacity-40 sm:size-40"
          />
        </div>

        <div v-else class="relative z-10 w-full">
          <ClientOnly>
            <div class="coverflow">
              <Swiper
                :modules="[EffectCoverflow, Autoplay]"
                effect="coverflow"
                :centered-slides="true"
                :slides-per-view="'auto'"
                :initial-slide="initialSlide"
                :loop="canLoop"
                :speed="600"
                :grab-cursor="true"
                :autoplay="autoplay"
                :coverflow-effect="{
                  rotate: 22,
                  stretch: -20,
                  depth: 180,
                  modifier: 1,
                  slideShadows: false,
                }"
                class="coverflow__slider"
              >
                <SwiperSlide
                  v-for="album in visibleItems"
                  :key="album.id"
                  class="coverflow__slide"
                >
                  <div
                    class="aspect-square overflow-hidden rounded-md bg-primary-gray-dark"
                  >
                    <UiCoverImage :src="album.coverSrc" :alt="album.name" />
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>

            <!-- SSR / until hydrate -->
            <template #fallback>
              <div class="flex items-center justify-center gap-4 py-8">
                <div
                  class="size-32 shrink-0 animate-pulse rounded-md bg-primary-gray-dark opacity-40 sm:size-40"
                />
                <div
                  class="size-44 shrink-0 animate-pulse rounded-md bg-primary-gray-dark sm:size-52"
                />
                <div
                  class="size-32 shrink-0 animate-pulse rounded-md bg-primary-gray-dark opacity-40 sm:size-40"
                />
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>

      <UiButton text="Популярное" @click="navigateTo('/popular')" />
    </div>
  </section>
</template>

<style scoped>
.coverflow {
  overflow: hidden;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    #000 10%,
    #000 90%,
    transparent 100%
  );
}

.coverflow__slider {
  overflow: visible;
  padding-block: 1.75rem;
}

.coverflow__slider :deep(.swiper-wrapper) {
  align-items: center;
}

.coverflow__slide {
  width: 11rem;
  transition: opacity 0.35s ease;
}

.coverflow__slider :deep(.swiper-slide:not(.swiper-slide-active)) {
  opacity: 0.35;
}

.coverflow__slider :deep(.swiper-slide-active) {
  opacity: 1;
}

@media (min-width: 40rem) {
  .coverflow__slide {
    width: 13rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .coverflow__slide {
    transition: none;
  }
}
</style>
