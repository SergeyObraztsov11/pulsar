<script setup lang="ts">
/**
 * Home — полки альбомов: продолжить, discovery, жанры.
 */
import type { Album } from "~/types/album";
import type { Genre } from "~/types/genre";
import type { ListPage } from "~/types/listPage";

definePageMeta({
  layout: "app-layout",
});

const SHELF_LIMIT = 10;

const { data: listenedPage, pending: listenedPending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-listened",
  query: { listened: "true", limit: SHELF_LIMIT },
});

const { data: newestPage, pending: newestPending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-newest",
  query: { sort: "createdAt", order: "desc", limit: SHELF_LIMIT },
});

const { data: likesPage, pending: likesPending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-likes",
  query: { sort: "likes", order: "desc", limit: SHELF_LIMIT },
});

const { data: playsPage, pending: playsPending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-plays",
  query: { sort: "plays", order: "desc", limit: SHELF_LIMIT },
});

const { data: likedPage, pending: likedPending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-liked",
  query: { liked: "true", sort: "likedAt", order: "desc", limit: SHELF_LIMIT },
});

const { data: genres } = await useFetch<Genre[]>("/api/genres", {
  key: "home-genres",
});

const { data: hipHopPage, pending: hipHopPending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-genre-hip-hop",
  query: {
    genre: "hip-hop",
    sort: "createdAt",
    order: "desc",
    limit: SHELF_LIMIT,
  },
});

const { data: indiePage, pending: indiePending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-genre-indie",
  query: {
    genre: "indie",
    sort: "createdAt",
    order: "desc",
    limit: SHELF_LIMIT,
  },
});

const { data: electronicPage, pending: electronicPending } = await useFetch<
  ListPage<Album>
>("/api/albums", {
  key: "home-albums-genre-electronic",
  query: {
    genre: "electronic",
    sort: "createdAt",
    order: "desc",
    limit: SHELF_LIMIT,
  },
});

const { data: popPage, pending: popPending } = await useFetch<ListPage<Album>>(
  "/api/albums",
  {
    key: "home-albums-genre-pop",
    query: {
      genre: "pop",
      sort: "createdAt",
      order: "desc",
      limit: SHELF_LIMIT,
    },
  },
);

function genreTitle(slug: string, fallback: string) {
  return genres.value?.find((genre) => genre.slug === slug)?.name ?? fallback;
}

function shelfItems(
  pending: boolean,
  page: ListPage<Album> | null | undefined,
): Album[] | null {
  if (pending && page == null) return null;
  return page?.items ?? [];
}

function showShelf(
  pending: boolean,
  page: ListPage<Album> | null | undefined,
): boolean {
  if (pending && page == null) return true;
  return (page?.items.length ?? 0) > 0;
}
</script>

<template>
  <div
    class="flex flex-col gap-10 p-4 animate-fade-up motion-reduce:animate-none sm:p-6 lg:gap-12"
  >
    <AlbumsSwiperSection
      v-if="showShelf(listenedPending, listenedPage)"
      title="Продолжить прослушивание"
      :items="shelfItems(listenedPending, listenedPage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(newestPending, newestPage)"
      title="Новые релизы"
      :items="shelfItems(newestPending, newestPage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(likesPending, likesPage)"
      title="Популярные"
      :items="shelfItems(likesPending, likesPage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(playsPending, playsPage)"
      title="Часто слушают"
      :items="shelfItems(playsPending, playsPage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(likedPending, likedPage)"
      title="Любимые альбомы"
      :items="shelfItems(likedPending, likedPage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(hipHopPending, hipHopPage)"
      :title="genreTitle('hip-hop', 'Hip-Hop')"
      :items="shelfItems(hipHopPending, hipHopPage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(indiePending, indiePage)"
      :title="genreTitle('indie', 'Indie')"
      :items="shelfItems(indiePending, indiePage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(electronicPending, electronicPage)"
      :title="genreTitle('electronic', 'Electronic')"
      :items="shelfItems(electronicPending, electronicPage)"
    />

    <AlbumsSwiperSection
      v-if="showShelf(popPending, popPage)"
      :title="genreTitle('pop', 'Pop')"
      :items="shelfItems(popPending, popPage)"
    />
  </div>
</template>
