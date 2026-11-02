<script setup lang="ts">
/**
 * UiRowFilter — ряд фильтров со swiper; v-model — выбранный value.
 * items nullish → loading-скелеты. Повторный клик — сброс.
 */
import { PhCaretLeft, PhCaretRight } from "@phosphor-icons/vue";
import type { Swiper as SwiperInstance } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";

export type RowFilterItem = {
  value: string;
  label: string;
};

/** Ширины loading-скелетов */
const LOADING_WIDTHS = [
  "w-20",
  "w-16",
  "w-24",
  "w-20",
  "w-16",
  "w-24",
  "w-20",
] as const;

const props = defineProps<{
  /** null / undefined — скелеты загрузки */
  items?: RowFilterItem[] | null;
  disabled?: boolean;
  /** aria-label для tablist */
  label?: string;
}>();

const model = defineModel<string>({ required: true });

const isLoading = computed(() => props.items == null);

const swiperInstance = shallowRef<SwiperInstance | null>(null);
const isBeginning = ref(true);
const isEnd = ref(true);

/** Кнопки только если есть переполнение */
const showNav = computed(
  () => !isLoading.value && (!isBeginning.value || !isEnd.value),
);

/** Синхронизация начала / конца ленты */
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

/** Выбрать пункт или снять выбор */
function onSelect(value: string) {
  if (props.disabled) return;
  model.value = model.value === value ? "" : value;
}

watch(
  () => props.items,
  async () => {
    await nextTick();
    const swiper = swiperInstance.value;
    if (!swiper) return;
    swiper.update();
    syncNav(swiper);
  },
  { deep: true },
);
</script>

<template>
  <!-- Loading: скелеты -->
  <div
    v-if="isLoading"
    class="flex w-full min-w-0 flex-row flex-nowrap gap-2 overflow-hidden"
    aria-busy="true"
    :aria-label="label"
  >
    <div
      v-for="(widthClass, index) in LOADING_WIDTHS"
      :key="index"
      class="h-8 shrink-0 animate-pulse rounded-full bg-tone-surface"
      :class="widthClass"
    />
  </div>

  <!-- Ряд: слайды + опционально prev/next -->
  <div v-else class="flex w-full min-w-0 items-center gap-2">
    <div
      class="row-filter min-w-0 flex-1 overflow-hidden"
      :class="{
        'row-filter--fade-left': showNav && !isBeginning,
        'row-filter--fade-right': showNav && !isEnd,
      }"
      role="tablist"
      :aria-label="label"
    >
      <ClientOnly>
        <Swiper
          :modules="[FreeMode]"
          :slides-per-view="'auto'"
          :space-between="8"
          :watch-overflow="true"
          :free-mode="{ enabled: true, momentum: true, sticky: false }"
          class="row-filter__slider w-full"
          @swiper="onSwiper"
          @slide-change="onSlideChange"
          @progress="onSlideChange"
          @reach-beginning="onSlideChange"
          @reach-end="onSlideChange"
          @from-edge="onSlideChange"
        >
          <SwiperSlide
            v-for="item in items"
            :key="item.value"
            class="w-auto! shrink-0"
          >
            <button
              type="button"
              role="tab"
              class="inline-flex h-8 shrink-0 items-center rounded-full px-3 text-sm font-medium leading-none transition-[transform,colors,opacity] duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transform-none motion-reduce:hover:scale-100"
              :class="
                model === item.value
                  ? 'bg-tone-white text-tone-canvas'
                  : 'bg-tone-surface text-tone-white hover:bg-tone-surface-hover'
              "
              :disabled="disabled"
              :aria-selected="model === item.value"
              @click="onSelect(item.value)"
            >
              {{ item.label }}
            </button>
          </SwiperSlide>
        </Swiper>

        <template #fallback>
          <div class="flex flex-row flex-nowrap gap-2 overflow-hidden">
            <button
              v-for="item in items ?? []"
              :key="item.value"
              type="button"
              class="inline-flex h-8 shrink-0 items-center rounded-full px-3 text-sm font-medium leading-none"
              :class="
                model === item.value
                  ? 'bg-tone-white text-tone-canvas'
                  : 'bg-tone-surface text-tone-white'
              "
            >
              {{ item.label }}
            </button>
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Prev / next — как у полок альбомов -->
    <div v-if="showNav" class="flex shrink-0 items-center gap-2">
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-full bg-tone-surface text-tone-white transition-[transform,colors,opacity] duration-200 hover:scale-[1.02] hover:bg-tone-surface-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transform-none motion-reduce:hover:scale-100"
        aria-label="Назад"
        :disabled="isBeginning"
        @click="slidePrev"
      >
        <PhCaretLeft :size="20" weight="light" />
      </button>
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-full bg-tone-surface text-tone-white transition-[transform,colors,opacity] duration-200 hover:scale-[1.02] hover:bg-tone-surface-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transform-none motion-reduce:hover:scale-100"
        aria-label="Вперёд"
        :disabled="isEnd"
        @click="slideNext"
      >
        <PhCaretRight :size="20" weight="light" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.row-filter--fade-left {
  mask-image: linear-gradient(to right, transparent 0%, #000 12%, #000 100%);
}

.row-filter--fade-right {
  mask-image: linear-gradient(to right, #000 0%, #000 88%, transparent 100%);
}

.row-filter--fade-left.row-filter--fade-right {
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    #000 12%,
    #000 88%,
    transparent 100%
  );
}

.row-filter__slider :deep(.swiper-wrapper) {
  display: flex;
  flex-direction: row;
}
</style>
