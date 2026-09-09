<script setup lang="ts">
/**
 * Landing Pulsar — лаконично, музыка вперёд.
 * Hero: крупный заголовок + бегущая «стена обложек».
 * Ниже: полка новых релизов, три возможности, цифры площадки, CTA.
 * Гость: без play, лайков и очереди.
 */
import type { Album } from "~/types/album";
import type { Track } from "~/types/track";
import { toMediaSrc } from "~/utils/mediaSrc";
import { pluralizeRu } from "~/utils/pluralizeRu";

definePageMeta({
  layout: "guest-layout",
});

const { data: albums } = await useFetch<Album[]>("/api/albums", {
  query: { sort: "newest" },
});

/** Треки — только для счётчика, грузим после отрисовки */
const { data: tracks } = useFetch<Track[]>("/api/tracks", {
  query: { sort: "newest" },
  lazy: true,
  server: false,
  default: () => [],
});

const list = computed(() => albums.value ?? []);
const withCover = computed(() =>
  list.value.filter((album) => Boolean(album.coverSrc)),
);

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

const SHELF_LIMIT = 14;
/** Полку показываем, если в ней есть что листать */
const SHELF_MIN = 3;

type Shelf = {
  key: string;
  title: string;
  description?: string;
  items: Album[];
  /** false — только название (полка одного артиста) */
  showArtist?: boolean;
};

/** Полки подборок: новинки · самый частый жанр · артист с наибольшим числом релизов */
const shelves = computed<Shelf[]>(() => {
  const all = list.value;
  const result: Shelf[] = [];

  result.push({
    key: "newest",
    title: "Новые релизы",
    description: "То, что вышло на площадке последним",
    items: all.slice(0, SHELF_LIMIT),
  });

  // Жанр, у которого больше всего релизов
  const genreCount = new Map<string, { name: string; count: number }>();
  for (const album of all) {
    for (const genre of album.genres) {
      const entry = genreCount.get(genre.id) ?? { name: genre.name, count: 0 };
      entry.count += 1;
      genreCount.set(genre.id, entry);
    }
  }
  const topGenre = [...genreCount.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  )[0];
  if (topGenre && topGenre[1].count >= SHELF_MIN) {
    const [genreId, { name }] = topGenre;
    result.push({
      key: `genre:${genreId}`,
      title: name,
      description: "Самый большой жанр на Pulsar",
      items: all
        .filter((album) => album.genres.some((genre) => genre.id === genreId))
        .slice(0, SHELF_LIMIT),
    });
  }

  // Артист с наибольшим числом релизов
  const artistCount = new Map<string, { name: string; count: number }>();
  for (const album of all) {
    const entry = artistCount.get(album.artistId) ?? {
      name: album.artist.name,
      count: 0,
    };
    entry.count += 1;
    artistCount.set(album.artistId, entry);
  }
  const topArtist = [...artistCount.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  )[0];
  if (topArtist && topArtist[1].count >= SHELF_MIN) {
    const [artistId, { name }] = topArtist;
    result.push({
      key: `artist:${artistId}`,
      title: name,
      description: "Больше всего релизов на площадке",
      items: all
        .filter((album) => album.artistId === artistId)
        .slice(0, SHELF_LIMIT),
      showArtist: false,
    });
  }

  return result.filter((shelf) => shelf.items.length >= SHELF_MIN);
});

const reduceMotion = computed(() => {
  if (import.meta.server) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
});

/** Цифры площадки: релизы · артисты · треки */
const stats = computed(() => {
  const albumsCount = list.value.length;
  const artistsCount = new Set(list.value.map((album) => album.artistId)).size;
  const tracksCount = tracks.value?.length ?? 0;
  return [
    {
      key: "albums",
      value: albumsCount,
      label: pluralizeRu(albumsCount, "релиз", "релиза", "релизов"),
    },
    {
      key: "artists",
      value: artistsCount,
      label: pluralizeRu(artistsCount, "артист", "артиста", "артистов"),
    },
    {
      key: "tracks",
      value: tracksCount,
      label: pluralizeRu(tracksCount, "трек", "трека", "треков"),
    },
  ];
});

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

/** Стартуем при появлении; догоняем, если треки подъехали позже */
watch([statsVisible, stats], ([visible]) => {
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
    <!-- Hero: заголовок + стена обложек -->
    <section class="px-4 pt-28 sm:px-8 sm:pt-32 lg:px-10 lg:pt-16">
      <div
        class="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.1fr_1fr] lg:gap-16"
      >
        <div class="flex flex-col gap-7 animate-fade-up">
          <h1
            class="text-6xl font-extrabold leading-[0.92] tracking-tight text-tone-white sm:text-7xl lg:text-8xl"
          >
            Слушай.<br />
            Собирай.<br />
            Выкладывай.
          </h1>
          <p
            class="max-w-md text-lg leading-relaxed text-tone-white sm:text-xl"
          >
            Pulsar — площадка для музыки, которую делают сейчас. Без подписки.
          </p>
          <div class="flex flex-wrap items-center gap-5 pt-1">
            <NuxtLink
              to="/register"
              class="inline-flex h-14 items-center rounded-full bg-tone-white px-8 text-base font-medium leading-none text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100"
            >
              Создать аккаунт
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="inline-flex h-14 items-center text-base font-medium leading-none text-tone-white transition-colors hover:text-tone-muted"
            >
              Войти
            </NuxtLink>
          </div>
        </div>

        <!-- Стена обложек: колонки бегут с разной скоростью -->
        <div
          v-if="wallColumns.length"
          class="cover-wall h-[60vh] min-h-96 overflow-hidden lg:h-[calc(100dvh-8rem)] lg:max-h-208"
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
    <!-- Цифры площадки: три числа, ничего лишнего -->
    <section ref="statsRef" class="px-4 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <dl
        class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 border-t border-tone-surface pt-12 sm:grid-cols-3 sm:gap-8 sm:pt-14"
      >
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="flex flex-col items-center gap-3 text-center"
        >
          <dd
            class="text-7xl font-extrabold leading-none tracking-tight tabular-nums text-tone-white sm:text-8xl lg:text-9xl"
          >
            {{ shown[stat.key] ?? 0 }}
          </dd>
          <dt class="text-base text-tone-white sm:text-lg">
            {{ stat.label }}
          </dt>
        </div>
      </dl>
    </section>
    <!-- CTA -->
    <section class="px-4 pt-28 sm:px-8 sm:pt-36 lg:px-10">
      <div
        class="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 text-center"
      >
        <h2
          class="max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tight text-tone-white sm:text-7xl"
        >
          Твоя музыка<br />уже здесь
        </h2>
        <NuxtLink
          to="/register"
          class="inline-flex h-14 items-center rounded-full bg-tone-white px-8 text-base font-medium leading-none text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100"
        >
          Создать аккаунт
        </NuxtLink>
      </div>
    </section>
    <!-- Три возможности — тот же ритм, что у цифр -->
    <section class="px-4 pt-28 sm:px-8 sm:pt-36 lg:px-10">
      <div
        class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 pt-12 sm:grid-cols-3 sm:gap-8 sm:pt-14"
      >
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex flex-col items-center gap-4 text-center"
        >
          <h3
            class="text-4xl font-bold leading-none tracking-tight text-tone-white sm:text-5xl"
          >
            {{ feature.title }}
          </h3>
          <p class="max-w-xs text-base leading-relaxed text-tone-white">
            {{ feature.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Подборки: новинки · жанр · артист -->
    <section
      v-if="shelves.length"
      class="px-4 pb-24 pt-28 sm:px-8 sm:pb-28 sm:pt-36 lg:px-10"
    >
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-16 sm:gap-20">
        <AlbumsSwiperSection
          v-for="shelf in shelves"
          :key="shelf.key"
          :title="shelf.title"
          :description="shelf.description"
          :items="shelf.items"
          :interactive="false"
          :show-artist="shelf.showArtist ?? true"
        />
      </div>
    </section>

    <div class="px-4 pb-10 sm:px-8 lg:px-10">
      <div class="mx-auto w-full max-w-7xl">
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Стена обложек: края растворяются в фоне */
.cover-wall {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    #000 12%,
    #000 88%,
    transparent 100%
  );
}

/* Колонка бежит вверх; вторая половина — копия для бесшовного цикла */
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
    transform: translateY(calc(-50% - 0.5rem));
  }
}

@keyframes cover-wall-down {
  from {
    transform: translateY(calc(-50% - 0.5rem));
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
