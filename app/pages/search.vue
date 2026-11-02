<script setup lang="ts">
/**
 * Search — выдача по q из URL; без q — пусто. Поля на странице нет.
 */
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { ListPage } from "~/types/listPage";
import type { Track } from "~/types/track";
import {
  buildSearchQuery,
  parseSearchType,
  SEARCH_TYPE_OPTIONS,
  type SearchType,
  type SearchTypeFilter,
} from "~/types/search";
import { scoreSearchFields } from "~/utils/searchRelevance";

definePageMeta({
  layout: "app-layout",
});

const TRACK_LIMIT = 20;
const ALBUM_LIMIT = 10;
const ARTIST_LIMIT = 10;

const route = useRoute();

const q = computed(() =>
  typeof route.query.q === "string" ? route.query.q.trim() : "",
);
const type = computed(() => parseSearchType(route.query.type));

const hasQuery = computed(() => q.value.length > 0);

/** Обновить type в URL (пусто = «Все») */
function setType(next: SearchType | undefined) {
  if (next === type.value) return;
  void navigateTo({
    path: "/search",
    query: buildSearchQuery({
      q: q.value || undefined,
      type: next,
    }),
  });
}

const typeModel = computed({
  get: (): SearchTypeFilter => type.value ?? "",
  set: (value: SearchTypeFilter) => {
    setType(value ? parseSearchType(value) : undefined);
  },
});

const showArtistsBlock = computed(
  () => hasQuery.value && (type.value == null || type.value === "artists"),
);
const showTracksBlock = computed(
  () => hasQuery.value && (type.value == null || type.value === "tracks"),
);
const showAlbumsBlock = computed(
  () => hasQuery.value && (type.value == null || type.value === "albums"),
);

const {
  data: artistsPage,
  pending: artistsPending,
  execute: executeArtists,
} = await useFetch<ListPage<Artist>>("/api/artists", {
  key: "search-page:artists",
  query: computed(() => ({
    search: q.value,
    limit: ARTIST_LIMIT,
  })),
  lazy: true,
  immediate: false,
  watch: false,
});

const {
  data: tracksPage,
  pending: tracksPending,
  execute: executeTracks,
} = await useFetch<ListPage<Track>>("/api/tracks", {
  key: "search-page:tracks",
  query: computed(() => ({
    search: q.value,
    limit: TRACK_LIMIT,
  })),
  lazy: true,
  immediate: false,
  watch: false,
});

const {
  data: albumsPage,
  pending: albumsPending,
  execute: executeAlbums,
} = await useFetch<ListPage<Album>>("/api/albums", {
  key: "search-page:albums",
  query: computed(() => ({
    search: q.value,
    limit: ALBUM_LIMIT,
  })),
  lazy: true,
  immediate: false,
  watch: false,
});

watch(
  [hasQuery, showArtistsBlock, showTracksBlock, showAlbumsBlock, q],
  () => {
    if (!hasQuery.value) return;
    if (showArtistsBlock.value) void executeArtists();
    if (showTracksBlock.value) void executeTracks();
    if (showAlbumsBlock.value) void executeAlbums();
  },
  { immediate: true },
);

function shelfItems<T>(
  pending: boolean,
  page: ListPage<T> | null | undefined,
): T[] | null {
  if (pending && page == null) return null;
  return page?.items ?? [];
}

const artists = computed(() =>
  shelfItems(artistsPending.value, artistsPage.value),
);
const tracks = computed(() =>
  shelfItems(tracksPending.value, tracksPage.value),
);
const albums = computed(() =>
  shelfItems(albumsPending.value, albumsPage.value),
);

type TopResult =
  | { kind: "artist"; artist: Artist; score: number }
  | { kind: "album"; album: Album; score: number }
  | { kind: "track"; track: Track; score: number };

const KIND_RANK: Record<TopResult["kind"], number> = {
  artist: 0,
  album: 1,
  track: 2,
};

/** Ждём все видимые списки, чтобы выбрать лучший топ */
const topPending = computed(() => {
  if (!hasQuery.value) return false;
  return (
    (showArtistsBlock.value && artists.value == null) ||
    (showTracksBlock.value && tracks.value == null) ||
    (showAlbumsBlock.value && albums.value == null)
  );
});

/** Наиболее релевантный результат среди загруженных сущностей */
const topResult = computed((): TopResult | null => {
  if (topPending.value) return null;

  const query = q.value;
  const candidates: TopResult[] = [];

  if (showArtistsBlock.value && artists.value) {
    for (const artist of artists.value) {
      const score = scoreSearchFields(query, artist.name);
      candidates.push({
        kind: "artist",
        artist,
        score: score < 0 ? 0 : score,
      });
    }
  }

  if (showAlbumsBlock.value && albums.value) {
    for (const album of albums.value) {
      const score = scoreSearchFields(query, album.name, album.artist.name);
      candidates.push({
        kind: "album",
        album,
        score: score < 0 ? 0 : score,
      });
    }
  }

  if (showTracksBlock.value && tracks.value) {
    for (const track of tracks.value) {
      const score = scoreSearchFields(
        query,
        track.name,
        track.artist.name,
        track.album.name,
      );
      candidates.push({
        kind: "track",
        track,
        score: score < 0 ? 0 : score,
      });
    }
  }

  if (candidates.length === 0) return null;

  return candidates.reduce((best, cur) => {
    if (cur.score !== best.score) {
      return cur.score > best.score ? cur : best;
    }
    return KIND_RANK[cur.kind] < KIND_RANK[best.kind] ? cur : best;
  });
});

/** Остальные исполнители (фильтр artists), по релевантности */
const otherArtists = computed(() => {
  if (type.value !== "artists") return [];
  const list = artists.value;
  if (list == null || list.length === 0) return [];

  const topId =
    topResult.value?.kind === "artist" ? topResult.value.artist.id : null;

  return [...list]
    .filter((artist) => artist.id !== topId)
    .sort(
      (a, b) =>
        scoreSearchFields(q.value, b.name) - scoreSearchFields(q.value, a.name),
    );
});

/** Треки под топом — без дубля топ-трека */
const tracksForList = computed(() => {
  const list = tracks.value;
  if (list == null) return null;
  if (topResult.value?.kind !== "track") return list;
  const topId = topResult.value.track.id;
  return list.filter((track) => track.id !== topId);
});

/** Альбомы под топом — без дубля топ-альбома */
const albumsForList = computed(() => {
  const list = albums.value;
  if (list == null) return null;
  if (topResult.value?.kind !== "album") return list;
  const topId = topResult.value.album.id;
  return list.filter((album) => album.id !== topId);
});

const tracksEmpty = computed(
  () =>
    showTracksBlock.value &&
    !tracksPending.value &&
    (tracksForList.value?.length ?? 0) === 0 &&
    topResult.value?.kind !== "track",
);

const albumsEmpty = computed(
  () =>
    showAlbumsBlock.value &&
    !albumsPending.value &&
    (albumsForList.value?.length ?? 0) === 0 &&
    topResult.value?.kind !== "album",
);

const artistsEmpty = computed(
  () =>
    showArtistsBlock.value &&
    !artistsPending.value &&
    (artistsPage.value?.items.length ?? 0) === 0,
);

/** Все видимые блоки пусты */
const allEmpty = computed(() => {
  if (!hasQuery.value) return false;
  const waiting =
    (showArtistsBlock.value &&
      artistsPending.value &&
      artistsPage.value == null) ||
    (showTracksBlock.value &&
      tracksPending.value &&
      tracksPage.value == null) ||
    (showAlbumsBlock.value &&
      albumsPending.value &&
      albumsPage.value == null);
  if (waiting) return false;

  const artistOk = !showArtistsBlock.value || artistsEmpty.value;
  const trackOk = !showTracksBlock.value || tracksEmpty.value;
  const albumOk = !showAlbumsBlock.value || albumsEmpty.value;
  return artistOk && trackOk && albumOk;
});

const showAlbumsShelf = computed(() => {
  if (!showAlbumsBlock.value) return false;
  if (albumsForList.value == null) return true;
  return albumsForList.value.length > 0;
});
</script>

<template>
  <div
    class="flex flex-col gap-8 p-4 animate-fade-up motion-reduce:animate-none sm:p-6 lg:gap-10"
  >
    <template v-if="hasQuery">
      <!-- Тип: как UiButton white / gray -->
      <div
        class="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Тип поиска"
      >
        <button
          v-for="item in SEARCH_TYPE_OPTIONS"
          :key="item.value || 'all'"
          type="button"
          role="tab"
          class="inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium leading-none transition-[color,background-color,opacity,transform] duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none motion-reduce:hover:scale-100"
          :class="
            typeModel === item.value
              ? 'bg-tone-white text-tone-canvas hover:opacity-90'
              : 'bg-tone-surface text-tone-white hover:bg-tone-surface-hover'
          "
          :aria-selected="typeModel === item.value"
          @click="typeModel = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <p v-if="allEmpty" class="text-sm text-tone-muted">Ничего не найдено</p>

      <template v-else>
        <!-- Топ: наиболее релевантный результат -->
        <div
          v-if="topPending"
          class="h-28 animate-pulse rounded-lg bg-tone-surface sm:h-36"
          aria-hidden="true"
        />
        <SearchTopArtistCard
          v-else-if="topResult?.kind === 'artist'"
          :artist="topResult.artist"
        />
        <SearchTopAlbumCard
          v-else-if="topResult?.kind === 'album'"
          :album="topResult.album"
        />
        <SearchTopTrackCard
          v-else-if="topResult?.kind === 'track'"
          :track="topResult.track"
        />

        <!-- Остальные исполнители (фильтр artists) -->
        <div
          v-if="type === 'artists' && otherArtists.length > 0"
          class="flex flex-col"
        >
          <SearchArtistSuggestRow
            v-for="artist in otherArtists"
            :key="artist.id"
            :artist="artist"
          />
        </div>

        <!-- Треки -->
        <section
          v-if="showTracksBlock && (tracks == null || (tracksForList?.length ?? 0) > 0)"
          class="flex flex-col gap-2"
        >
          <div
            v-if="tracks == null"
            class="flex flex-col gap-1"
            aria-busy="true"
          >
            <TrackCardSkeleton v-for="index in 5" :key="index" />
          </div>
          <TracksColumnSection
            v-else-if="tracksForList && tracksForList.length > 0"
            variant="cover"
            :items="tracksForList"
            :limit="TRACK_LIMIT"
          />
        </section>

        <!-- Альбомы -->
        <AlbumsSwiperSection
          v-if="showAlbumsShelf"
          :items="albumsForList"
        />
      </template>
    </template>
  </div>
</template>
