<script setup lang="ts">
/**
 * TracksSwiperSection — горизонтальный swiper треков (snap по колонкам).
 * Слайд = колонка из 5 треков; на lg видно 2 колонки.
 * items nullish → скелетоны; [] → пусто.
 */
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import type { Track } from "~/types/track";

const COLUMN_SIZE = 5;

const props = withDefaults(
  defineProps<{
    items?: Track[] | null;
    variant?: "cover" | "ranked" | "index";
    interactive?: boolean;
    /** Число колонок-скелетонов при загрузке */
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
    variant: "cover",
    interactive: true,
    skeletonCount: 2,
  },
);

const isLoading = computed(() => props.items == null);

const visibleItems = computed(() => {
  if (!props.items) return [];
  return props.limit != null ? props.items.slice(0, props.limit) : props.items;
});

/** Колонки по COLUMN_SIZE треков */
const columns = computed(() => {
  const items = visibleItems.value;
  const result: Track[][] = [];
  for (let i = 0; i < items.length; i += COLUMN_SIZE) {
    result.push(items.slice(i, i + COLUMN_SIZE));
  }
  return result;
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

function trackRank(columnIndex: number, trackIndex: number) {
  return columnIndex * COLUMN_SIZE + trackIndex + 1;
}
</script>

<template>
  <!-- Tracks shelf -->
  <section class="flex flex-col gap-6">
    <!-- Header -->
    <div
      v-if="props.title"
      class="flex items-end justify-between gap-4"
    >
      <div class="flex min-w-0 flex-col gap-2">
        <NuxtLink
          v-if="props.to"
          :to="props.to"
          class="text-2xl font-bold text-primary-white transition-colors hover:underline"
        >
          {{ props.title }}
        </NuxtLink>
        <h2
          v-else
          class="text-2xl font-bold text-primary-white"
        >
          {{ props.title }}
        </h2>
        <p
          v-if="props.description"
          class=" text-primary-gray"
        >
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
      <div
        v-for="n in props.skeletonCount"
        :key="n"
        class="flex min-w-0 flex-1 flex-col gap-1"
      >
        <TrackCardSkeleton v-for="row in COLUMN_SIZE" :key="row" />
      </div>
    </div>

    <div v-else class="tracks-shelf w-full">
      <ClientOnly>
        <Swiper
          :slides-per-view="1"
          :slides-per-group="1"
          :space-between="24"
          :watch-overflow="true"
          :breakpoints="{
            1024: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 24 },
          }"
          class="tracks-shelf__slider w-full"
          @swiper="onSwiper"
          @slide-change="onSlideChange"
          @reach-beginning="onSlideChange"
          @reach-end="onSlideChange"
          @from-edge="onSlideChange"
        >
          <SwiperSlide
            v-for="(column, columnIndex) in columns"
            :key="column[0]?.id ?? columnIndex"
            class="min-w-0"
          >
            <!-- Column of tracks -->
            <div class="flex flex-col gap-1">
              <template v-if="props.variant === 'cover'">
                <TrackCoverCard
                  v-for="track in column"
                  :key="track.id"
                  :track="track"
                  :interactive="props.interactive"
                />
              </template>
              <template v-else-if="props.variant === 'ranked'">
                <TrackRankedCard
                  v-for="(track, trackIndex) in column"
                  :key="track.id"
                  :track="track"
                  :rank="trackRank(columnIndex, trackIndex)"
                  :interactive="props.interactive"
                />
              </template>
              <template v-else>
                <TrackIndexCard
                  v-for="track in column"
                  :key="track.id"
                  :track="track"
                  :interactive="props.interactive"
                />
              </template>
            </div>
          </SwiperSlide>
        </Swiper>

        <!-- SSR / until hydrate -->
        <template #fallback>
          <div class="flex flex-row flex-nowrap gap-6 overflow-hidden">
            <div
              v-for="n in props.skeletonCount"
              :key="n"
              class="flex min-w-0 flex-1 flex-col gap-1"
            >
              <TrackCardSkeleton v-for="row in COLUMN_SIZE" :key="row" />
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </section>
</template>

<style scoped>
.tracks-shelf__slider :deep(.swiper-wrapper) {
  display: flex;
  flex-direction: row;
}
</style>
