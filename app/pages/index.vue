<script setup lang="ts">
/**
 * Landing Pulsar — лаконично, музыка вперёд.
 * Hero: крупный заголовок + бегущая «стена обложек».
 * Ниже: цифры, бренд, возможности, полка новых релизов.
 * Гость: без play, лайков и очереди.
 */
import type { Album } from "~/types/album";
import type { ListPage } from "~/types/listPage";
import { toMediaSrc } from "~/utils/mediaSrc";
import { pluralizeRu } from "~/utils/pluralizeRu";

definePageMeta({
  layout: "guest-layout",
});

/** 10 новейших: полка + стена обложек */
const { data: albumsPage } = await useFetch<ListPage<Album>>("/api/albums", {
  query: { sort: "createdAt", order: "desc", limit: 10 },
});

const list = computed(() => albumsPage.value?.items ?? []);
const withCover = computed(() =>
  list.value.filter((album) => Boolean(album.coverSrc)),
);

/** Нижний swiper — те же 10 */
const newestAlbums = computed(() => list.value);

const WALL_COLUMNS = 3;
const MIN_PER_COLUMN = 6;

/** Колонки стены обложек; каждая дополняется до минимума и дублируется для цикла */
const wallColumns = computed(() => {
  const source = withCover.value.slice(0, 24);
  if (source.length === 0) return [];

  const columns: Album[][] = Array.from({ length: WALL_COLUMNS }, () => []);
  source.forEach((album, index) => {
    columns[index % WALL_COLUMNS]!.push(album);
  });

  return columns.map((column) => {
    const filled = [...column];
    let i = 0;
    while (filled.length < MIN_PER_COLUMN && source.length > 0) {
      filled.push(source[i % source.length]!);
      i += 1;
    }
    return [...filled, ...filled];
  });
});

const reduceMotion = computed(() => {
  if (import.meta.server) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
});

/** Цифры площадки — захардкожены (без лишних запросов) */
const STATS = [
  { key: "albums", value: 128, one: "релиз", few: "релиза", many: "релизов" },
  {
    key: "artists",
    value: 46,
    one: "артист",
    few: "артиста",
    many: "артистов",
  },
  { key: "tracks", value: 940, one: "трек", few: "трека", many: "треков" },
] as const;

const stats = computed(() =>
  STATS.map((stat) => ({
    key: stat.key,
    value: stat.value,
    label: pluralizeRu(stat.value, stat.one, stat.few, stat.many),
  })),
);

/** Счётчики: анимируем от 0 к значению при появлении секции */
const statsRef = ref<HTMLElement | null>(null);
const statsVisible = ref(false);
const shown = ref<Record<string, number>>({});

const COUNT_MS = 900;
let countRaf = 0;

/** Ease-out — быстро стартует, мягко доезжает */
function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function runCount() {
  cancelAnimationFrame(countRaf);
  const targets = stats.value;

  if (reduceMotion.value) {
    shown.value = Object.fromEntries(targets.map((s) => [s.key, s.value]));
    return;
  }

  const from = { ...shown.value };
  const start = performance.now();

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / COUNT_MS);
    const k = easeOut(t);
    shown.value = Object.fromEntries(
      targets.map((s) => {
        const base = from[s.key] ?? 0;
        return [s.key, Math.round(base + (s.value - base) * k)];
      }),
    );
    if (t < 1) countRaf = requestAnimationFrame(step);
  };

  countRaf = requestAnimationFrame(step);
}

onMounted(() => {
  const el = statsRef.value;
  if (!el) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        statsVisible.value = true;
        observer.disconnect();
      }
    },
    { threshold: 0.4 },
  );
  observer.observe(el);
  onUnmounted(() => observer.disconnect());
});

/** Стартуем анимацию счётчиков при появлении секции */
watch(statsVisible, (visible) => {
  if (visible) runCount();
});

onUnmounted(() => cancelAnimationFrame(countRaf));

const features = [
  {
    title: "Слушай",
    text: "Новые релизы без шума: альбомы, треки, очередь — в один клик.",
  },
  {
    title: "Собирай",
    text: "Плейлисты и любимое живут рядом с тем, что выходит сегодня.",
  },
  {
    title: "Выкладывай",
    text: "Свой альбом на площадке за несколько минут. Бесплатно.",
  },
] as const;
</script>

<template>
  <div class="bg-tone-canvas text-tone-white">
    <!-- Hero: копирайт + стена обложек (стена скрыта ниже lg) -->
    <section class="px-10 pt-16 border-b border-tone-surface">
      <div
        class="mx-auto grid w-full max-w-7xl min-h-[calc(100dvh-4rem)] grid-cols-1 items-center gap-16 lg:grid-cols-[1.1fr_1fr]"
      >
        <!-- Stagger: заголовок → описание → CTA, шаг 120ms -->
        <div class="flex flex-col items-start gap-7">
          <h1
            class="text-8xl font-extrabold tracking-tight text-tone-white animate-fade-up motion-reduce:animate-none [animation-delay:0ms]"
          >
            Слушай<br />
            Собирай<br />
            Выкладывай
          </h1>
          <p
            class="max-w-md text-pretty text-xl leading-relaxed text-tone-white animate-fade-up motion-reduce:animate-none [animation-delay:120ms]"
          >
            Pulsar — площадка для музыки, которую делают сейчас. Без подписки.
          </p>
          <div
            class="flex flex-wrap items-center gap-5 pt-1 animate-fade-up motion-reduce:animate-none [animation-delay:240ms]"
          >
            <NuxtLink
              to="/register"
              class="inline-flex h-14 items-center rounded-full bg-tone-white px-8 text-base font-medium leading-none text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100"
            >
              Создать аккаунт
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="inline-flex h-14 items-center px-2 text-base font-medium leading-none text-tone-white transition-colors hover:text-tone-muted"
            >
              Войти
            </NuxtLink>
          </div>
        </div>

        <!-- Стена обложек — только на lg -->
        <div
          v-if="wallColumns.length"
          class="cover-wall hidden h-[calc(100dvh-8rem)] max-h-208 overflow-hidden animate-fade-up motion-reduce:animate-none [animation-delay:240ms] lg:block"
          aria-hidden="true"
        >
          <div class="grid h-full grid-cols-3 gap-4">
            <div
              v-for="(column, columnIndex) in wallColumns"
              :key="columnIndex"
              class="cover-wall__column flex flex-col gap-4"
              :class="
                columnIndex % 2 === 1 ? 'cover-wall__column--reverse' : ''
              "
              :style="{ animationDuration: `${52 + columnIndex * 14}s` }"
            >
              <div
                v-for="(album, index) in column"
                :key="`${album.id}-${index}`"
                class="aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-tone-surface"
              >
                <img
                  v-if="toMediaSrc(album.coverSrc)"
                  :src="toMediaSrc(album.coverSrc)!"
                  alt=""
                  class="size-full object-cover"
                  loading="lazy"
                  draggable="false"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Цифры -->
    <section ref="statsRef" class="px-10 pt-32">
      <dl class="mx-auto grid w-full max-w-7xl grid-cols-3 gap-8 pt-14">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="flex flex-col items-center gap-3 text-center"
        >
          <dd
            class="text-9xl font-extrabold leading-none tracking-tight tabular-nums text-tone-white"
          >
            {{ shown[stat.key] ?? 0 }}
          </dd>
          <dt class="text-lg text-tone-white">
            {{ stat.label }}
          </dt>
        </div>
      </dl>
    </section>

    <!-- Заявление + бренд -->
    <section class="px-10 pt-36">
      <div
        class="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 text-center"
      >
        <h2
          class=" text-7xl font-extrabold leading-[0.95] tracking-tight text-tone-white"
        >
          Твоя музыка уже здесь
        </h2>
      </div>
    </section>

    <!-- Три возможности -->
    <section class="px-10 pt-36">
      <div class="mx-auto grid w-full max-w-7xl grid-cols-3 gap-8 pt-14">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex flex-col items-center gap-4 text-center"
        >
          <h3
            class="text-5xl font-bold leading-none tracking-tight text-tone-white"
          >
            {{ feature.title }}
          </h3>
          <p class="max-w-xs text-base leading-relaxed text-tone-white">
            {{ feature.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- 10 самых новых релизов -->
    <section v-if="newestAlbums.length" class="px-10 pb-28 pt-36">
      <div class="mx-auto w-full max-w-7xl">
        <AlbumsSwiperSection
          title="Новые релизы"
          :items="newestAlbums"
          :interactive="false"
        />
      </div>
    </section>

    <div class="px-10 pb-10">
      <div class="mx-auto w-full max-w-7xl">
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cover-wall {
  /* Шаг между обложками (gap-4) — участвует в расчёте бесшовного цикла */
  --wall-gap: 1rem;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    #000 12%,
    #000 88%,
    transparent 100%
  );
}

.cover-wall__column {
  animation: cover-wall-up linear infinite;
  will-change: transform;
}

.cover-wall__column--reverse {
  animation-name: cover-wall-down;
}

@keyframes cover-wall-up {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(calc(-50% - var(--wall-gap) / 2));
  }
}

@keyframes cover-wall-down {
  from {
    transform: translateY(calc(-50% - var(--wall-gap) / 2));
  }
  to {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-wall__column {
    animation: none;
  }
}
</style>
