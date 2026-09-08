<script setup lang="ts">
/**
 * Landing Pulsar — своё:
 * SoundCloud: музыка вперёд, крупные заголовки, тёмный canvas
 * Spotify: полки обложек как вход в продукт
 * Своё: coverflow + wash как у альбома + стикеры
 * Без play для гостя.
 */
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay, EffectCoverflow, FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import "swiper/css/effect-coverflow";
import type { Album } from "~/types/album";
import { toMediaSrc } from "~/utils/mediaSrc";

definePageMeta({
  layout: "guest-layout",
});

const { data: albums } = await useFetch<Album[]>("/api/albums", {
  query: { sort: "newest" },
});

const heroItems = computed(() => (albums.value ?? []).slice(0, 5));
const shelfItems = computed(() => (albums.value ?? []).slice(0, 14));

const heroSlides = computed(() => {
  const list = heroItems.value;
  if (list.length !== 5) return [];
  return [
    ...list.map((album) => ({ album, key: `a-${album.id}` })),
    ...list.map((album) => ({ album, key: `b-${album.id}` })),
  ];
});

const activeIndex = ref(0);
const activeAlbum = computed(() => heroItems.value[activeIndex.value] ?? null);

const reduceMotion = computed(() => {
  if (import.meta.server) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
});

const heroColor = computed(() => {
  const color = activeAlbum.value?.coverColor?.trim();
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return "#282828";
});

/** Сплошной coverColor с лёгким затемнением — без градиента */
const heroBgStyle = computed(() => {
  const c = heroColor.value;
  return {
    backgroundColor: `color-mix(in srgb, ${c} 88%, var(--color-tone-shell))`,
  };
});

const whyItems = [
  {
    title: "Слушай",
    text: "Релизы и треки без лишнего шума.",
  },
  {
    title: "Собирай",
    text: "Плейлисты и любимое всегда под рукой.",
  },
  {
    title: "Выкладывай",
    text: "Свои альбомы — бесплатно, без подписки.",
  },
] as const;

function onSwiper(swiper: SwiperInstance) {
  activeIndex.value = swiper.realIndex % 5;
  syncVisible(swiper);
}

function onSlideChange(swiper: SwiperInstance) {
  activeIndex.value = swiper.realIndex % 5;
}

function syncVisible(swiper: SwiperInstance) {
  for (const slide of swiper.slides) {
    const el = slide as HTMLElement & { progress?: number };
    const abs = Math.abs(el.progress ?? 0);
    let opacity = 1;
    if (abs > 1) {
      opacity = Math.max(0, 1 - (abs - 1) / 0.4);
    }
    el.style.opacity = String(opacity);
    el.style.visibility = opacity < 0.05 ? "hidden" : "visible";
    el.style.pointerEvents = opacity > 0.1 ? "auto" : "none";
  }
}
</script>

<template>
  <div class="bg-tone-shell text-tone-white">
    <!-- Hero: discovery + CTA -->
    <section
      class="relative flex min-h-[82dvh] w-full flex-col justify-center pb-10 pt-20 transition-colors duration-500 motion-reduce:transition-none sm:pb-12 sm:pt-24"
      :style="heroBgStyle"
    >
      <div
        class="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-12 px-4 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:px-10"
      >
        <div class="flex flex-col gap-6">
          <h1
            class="text-5xl font-bold leading-[0.95] tracking-tight text-tone-white sm:text-6xl lg:text-7xl"
          >
            Слушай.<br />
            Собирай.<br />
            Выкладывай.
          </h1>
          <p
            class="max-w-md text-lg leading-relaxed text-tone-white sm:text-xl"
          >
            Pulsar — место для релизов и плейлистов. Без подписки, с коротким
            входом.
          </p>
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <NuxtLink
              to="/register"
              class="inline-flex h-12 items-center rounded-full bg-tone-white px-6 text-base font-medium leading-none text-tone-canvas transition-opacity hover:opacity-90"
            >
              Создать аккаунт
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="inline-flex h-12 items-center rounded-full px-5 text-base font-medium leading-none text-tone-white transition-colors hover:text-tone-muted"
            >
              Войти
            </NuxtLink>
          </div>
        </div>

        <div class="min-w-0">
          <ClientOnly>
            <Swiper
              v-if="heroSlides.length"
              :key="heroSlides.map((s) => s.key).join('|')"
              :modules="[Autoplay, EffectCoverflow]"
              effect="coverflow"
              :grab-cursor="true"
              :centered-slides="true"
              :slides-per-view="'auto'"
              :loop="true"
              :speed="500"
              :watch-slides-progress="true"
              :autoplay="
                reduceMotion
                  ? false
                  : {
                      delay: 3200,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }
              "
              :coverflow-effect="{
                rotate: -42,
                stretch: 0,
                depth: 200,
                modifier: 1,
                slideShadows: false,
              }"
              class="coverflow-swiper w-full"
              @swiper="onSwiper"
              @slide-change="onSlideChange"
              @set-translate="syncVisible"
            >
              <SwiperSlide
                v-for="slide in heroSlides"
                :key="slide.key"
                class="coverflow-swiper__slide"
              >
                <div class="coverflow-swiper__card">
                  <img
                    v-if="toMediaSrc(slide.album.coverSrc)"
                    :src="toMediaSrc(slide.album.coverSrc)!"
                    :alt="slide.album.name"
                    class="aspect-square w-full size-full overflow-hidden rounded-xl object-cover"
                    draggable="false"
                  />
                </div>
              </SwiperSlide>
            </Swiper>
          </ClientOnly>
        </div>
      </div>
    </section>

    

    <!-- Creators — SoundCloud-энергия, наш стикер -->
    <section class="px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div
        class="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
      >
        <div class="flex items-center justify-center lg:justify-start">
          <img
            src="/stikers/s1.png"
            alt=""
            class="w-48 sm:w-56 lg:w-64"
            draggable="false"
          />
        </div>
        <div
          class="flex min-h-48 flex-col justify-around lg:min-h-56 lg:items-end lg:text-right"
        >
          <h2
            class="max-w-lg text-4xl font-bold leading-[1.05] tracking-tight text-tone-white sm:text-5xl"
          >
            Всё начинается с загрузки
          </h2>
          <p
            class="max-w-md text-lg leading-relaxed text-tone-white sm:text-xl"
          >
            Выложи альбом бесплатно и сразу будь на площадке рядом с другими
            релизами.
          </p>
        </div>
      </div>
    </section>

    <!-- Listeners -->
    <section class="px-4 pb-20 pt-8 sm:px-8 sm:pb-28 sm:pt-10 lg:px-10">
      <div
        class="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
      >
        <div
          class="flex min-h-48 flex-col justify-around lg:min-h-56 lg:items-start"
        >
          <h2
            class="max-w-lg text-4xl font-bold leading-[1.05] tracking-tight text-tone-white sm:text-5xl"
          >
            А дальше — просто слушай
          </h2>
          <p
            class="max-w-md text-lg leading-relaxed text-tone-white sm:text-xl"
          >
            После короткой регистрации открывается вся музыка: поиск, плейлисты
            и любимое.
          </p>
        </div>
        <div class="flex items-center justify-center lg:justify-end">
          <img
            src="/stikers/s3.png"
            alt=""
            class="w-48 sm:w-56 lg:w-64"
            draggable="false"
          />
        </div>
      </div>
    </section>

    <div class="border-t border-tone-surface px-4 py-10 sm:px-8 lg:px-10">
      <div class="mx-auto w-full max-w-7xl">
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<style scoped>
.coverflow-swiper {
  overflow: visible;
  padding-block: 0.75rem;
}

.coverflow-swiper__slide {
  width: 15rem;
}

@media (min-width: 640px) {
  .coverflow-swiper__slide {
    width: 18rem;
  }
}

@media (min-width: 1024px) {
  .coverflow-swiper__slide {
    width: 20rem;
  }
}

.coverflow-swiper__card {
  transform: scale(0.92);
  transition: transform 0.35s ease;
  transform-origin: center center;
}

.coverflow-swiper :deep(.swiper-slide-active) .coverflow-swiper__card {
  transform: scale(1.06);
}

.coverflow-swiper :deep(.swiper-wrapper) {
  align-items: stretch;
}

.shelf-swiper :deep(.swiper-wrapper) {
  display: flex;
}

@media (prefers-reduced-motion: reduce) {
  .coverflow-swiper__card {
    transition: none;
  }
}
</style>
