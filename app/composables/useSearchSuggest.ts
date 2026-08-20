/**
 * useSearchSuggest — debounced подсказки /api/search по строке запроса.
 */
import { watchDebounced } from "@vueuse/core";
import type { MaybeRefOrGetter } from "vue";
import type { SearchSuggest } from "~/types/search";

export function useSearchSuggest(query: MaybeRefOrGetter<string>) {
  const pending = ref(false);
  const tracks = ref<SearchSuggest["tracks"]>([]);
  const albums = ref<SearchSuggest["albums"]>([]);
  const artists = ref<SearchSuggest["artists"]>([]);
  /** Запрос, под который уже пришёл ответ */
  const fetchedQuery = ref("");

  let abort: AbortController | null = null;

  const trimmedQuery = computed(() => toValue(query).trim());

  const hasResults = computed(
    () =>
      tracks.value.length + albums.value.length + artists.value.length > 0,
  );

  /** Пусто только когда ответ совпал с текущим запросом */
  const showEmpty = computed(
    () =>
      !pending.value &&
      fetchedQuery.value === trimmedQuery.value &&
      trimmedQuery.value.length > 0 &&
      !hasResults.value,
  );

  /** Сброс результатов */
  function clear() {
    tracks.value = [];
    albums.value = [];
    artists.value = [];
    fetchedQuery.value = "";
    pending.value = false;
  }

  /** Подсказки с API; предыдущий запрос отменяю */
  async function fetchSuggest(q: string) {
    abort?.abort();
    if (!q) {
      clear();
      return;
    }

    abort = new AbortController();
    const signal = abort.signal;
    pending.value = true;
    try {
      const data = await $fetch<SearchSuggest>("/api/search", {
        query: { q },
        signal,
      });
      tracks.value = data.tracks;
      albums.value = data.albums;
      artists.value = data.artists;
      fetchedQuery.value = q;
    } catch {
      if (signal.aborted) return;
      clear();
      fetchedQuery.value = q;
    } finally {
      if (!signal.aborted) pending.value = false;
    }
  }

  watchDebounced(
    trimmedQuery,
    (q) => {
      void fetchSuggest(q);
    },
    { debounce: 250 },
  );

  onBeforeUnmount(() => {
    abort?.abort();
  });

  return {
    pending,
    tracks,
    albums,
    artists,
    fetchedQuery,
    trimmedQuery,
    hasResults,
    showEmpty,
    clear,
  };
}
