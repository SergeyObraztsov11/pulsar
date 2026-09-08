<script setup lang="ts">
/**
 * AlbumsRowSwiper — горизонтальная лента альбомов (free-mode).
 */
import type { Swiper as SwiperInstance } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import type { Album } from "~/types/album";

const props = withDefaults(
  defineProps<{
    items?: Album[];
    interactive?: boolean;
    /** false — без строки артиста под названием */
    showArtist?: boolean;
  }>(),
  {
    items: () => [],
    interactive: true,
    showArtist: true,
  },
);

const isBeginning = ref(true);
const isEnd = ref(true);

function syncEdges(swiper: SwiperInstance) {
  isBeginning.value = swiper.isBeginning;
  isEnd.value = swiper.isEnd;
}
</script>

<template>
  <div
    v-if="props.items.length"
    class="albums-row-swiper w-full"
    :class="{
      'albums-row-swiper--fade-left': !isBeginning,
      'albums-row-swiper--fade-right': !isEnd,
    }"
  >
    <ClientOnly>
      <Swiper
        :modules="[FreeMode]"
        :slides-per-view="'auto'"
        :space-between="24"
        :watch-overflow="true"
        :free-mode="{ enabled: true, momentum: true }"
        class="albums-row-swiper__slider w-full"
        @swiper="syncEdges"
        @slide-change="syncEdges"
        @progress="syncEdges"
      >
        <SwiperSlide
          v-for="album in props.items"
          :key="album.id"
          class="w-48! shrink-0"
        >
          <AlbumCard
            :album="album"
            :interactive="props.interactive"
            :show-artist="props.showArtist"
          />
        </SwiperSlide>
      </Swiper>
    </ClientOnly>
  </div>
</template>

<style scoped>
.albums-row-swiper {
  overflow: hidden;
}

.albums-row-swiper--fade-left {
  mask-image: linear-gradient(to right, transparent 0%, #000 10%, #000 100%);
}

.albums-row-swiper--fade-right {
  mask-image: linear-gradient(to right, #000 0%, #000 90%, transparent 100%);
}

.albums-row-swiper--fade-left.albums-row-swiper--fade-right {
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    #000 10%,
    #000 90%,
    transparent 100%
  );
}

.albums-row-swiper__slider :deep(.swiper-wrapper) {
  display: flex;
  flex-direction: row;
}
</style>
