<script setup lang="ts">
/**
 * Search — поле, жанры, тип; q / type / genre живут в URL.
 */
import type { Genre } from "~/types/genre";
import {
  buildSearchQuery,
  parseSearchGenre,
  parseSearchType,
  SEARCH_TYPE_OPTIONS,
  type SearchType,
} from "~/types/search";

definePageMeta({
  layout: "app-layout",
});

const route = useRoute();

const { data: genres } = await useFetch<Genre[]>("/api/genres", {
  key: "search:genres",
  lazy: true,
});

// --- URL ---

const q = computed(() =>
  typeof route.query.q === "string" ? route.query.q : "",
);
const type = computed(() => parseSearchType(route.query.type));
const genre = computed(() => parseSearchGenre(route.query.genre));

/** Обновить query; ключ с undefined = сброс */
function setSearch(patch: {
  q?: string;
  type?: SearchType | undefined;
  genre?: string | undefined;
}) {
  const nextType = "type" in patch ? patch.type : type.value;
  const nextGenre =
    nextType === "playlists"
      ? undefined
      : "genre" in patch
        ? patch.genre
        : genre.value;

  void navigateTo({
    path: "/search",
    query: buildSearchQuery({
      q: "q" in patch ? patch.q : q.value || undefined,
      type: nextType,
      genre: nextGenre,
    }),
  });
}

// --- Поле ---

const fieldQuery = ref(q.value);

watch(q, (value) => {
  if (value !== fieldQuery.value) fieldQuery.value = value;
});

function onSearchSubmit(value: string) {
  setSearch({ q: value });
}

/** null пока жанры не пришли — RowFilter покажет скелеты */
const genreItems = computed(() => {
  if (genres.value == null) return null;
  return genres.value.map((item) => ({
    value: item.id,
    label: item.name,
  }));
});

const genreModel = computed({
  get: () => genre.value ?? "",
  set: (value: string) => {
    const next = value || undefined;
    if (next === genre.value) return;
    setSearch({ genre: next });
  },
});

const typeModel = computed({
  get: () => type.value ?? "",
  set: (value: string) => {
    const next = value ? parseSearchType(value) : undefined;
    if (next === type.value) return;
    setSearch({ type: next });
  },
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Анимация: fade-up -->
    <SearchPageField
      v-model="fieldQuery"
      class="animate-fade-up motion-reduce:animate-none [animation-delay:0ms]"
      @submit="onSearchSubmit"
    />
    <!-- Анимация: fade-up, задержка 120ms -->
    <div
      class="animate-fade-up motion-reduce:animate-none [animation-delay:120ms]"
    >
      <UiRowFilter
        v-model="typeModel"
        :items="SEARCH_TYPE_OPTIONS"
        label="Тип поиска"
      />
    </div>
    <!-- Анимация: fade-up, задержка 240ms -->
    <div
      class="animate-fade-up motion-reduce:animate-none [animation-delay:240ms]"
    >
      <UiRowFilter
        v-model="genreModel"
        :disabled="typeModel === 'playlists'"
        :items="genreItems"
        label="Жанр"
      />
    </div>
  </div>
</template>
