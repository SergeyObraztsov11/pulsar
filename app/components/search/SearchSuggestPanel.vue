<script setup lang="ts">
/**
 * SearchSuggestPanel — запросы + артисты / альбомы / треки.
 */
import { PhMagnifyingGlass } from "@phosphor-icons/vue";
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { Track } from "~/types/track";
import {
  buildSearchSuggestItems,
  type SearchSuggestItem,
} from "~/utils/searchDictionary";

const props = defineProps<{
  query: string;
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  showEmpty: boolean;
  hasResults: boolean;
  /** Индекс активного пункта (−1 = нет) */
  activeIndex?: number;
}>();

const emit = defineEmits<{
  select: [item: SearchSuggestItem];
}>();

const items = computed(() =>
  buildSearchSuggestItems({
    query: props.query,
    tracks: props.tracks,
    albums: props.albums,
    artists: props.artists,
  }),
);

defineExpose({ items });
</script>

<template>
  <div class="flex min-w-0 flex-col" role="listbox">
    <div
      v-if="props.showEmpty"
      class="mx-auto flex items-center gap-2 px-3 py-2"
    >
      <PhMagnifyingGlass class="shrink-0" :size="20" weight="light" />
      <p class="text-sm leading-normal">Ничего не найдено</p>
    </div>

    <template v-else-if="props.hasResults">
      <template v-for="(item, index) in items" :key="item.id">
        <SearchResultRow
          v-if="item.kind === 'query'"
          :to="item.to"
          :title="item.title"
          :query="props.query"
          :active="props.activeIndex === index"
          @select="emit('select', item)"
        />
        <SearchEntityRow
          v-else-if="item.kind === 'artist'"
          kind="artist"
          :artist="item.artist"
          :active="props.activeIndex === index"
          @pick="emit('select', item)"
        />
        <SearchEntityRow
          v-else-if="item.kind === 'album'"
          kind="album"
          :album="item.album"
          :active="props.activeIndex === index"
          @pick="emit('select', item)"
        />
        <SearchEntityRow
          v-else
          kind="track"
          :track="item.track"
          :active="props.activeIndex === index"
          @pick="emit('select', item)"
        />
      </template>
    </template>
  </div>
</template>
