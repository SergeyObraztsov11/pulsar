<script setup lang="ts">
/**
 * SearchEntityRow — строка сущности в suggest (артист / альбом / трек).
 */
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { Track } from "~/types/track";

defineProps<{
  kind: "artist" | "album" | "track";
  artist?: Artist;
  album?: Album;
  track?: Track;
  /** Подсветка с клавиатуры */
  active?: boolean;
}>();

const emit = defineEmits<{
  pick: [];
}>();
</script>

<template>
  <SearchArtistSuggestRow
    v-if="kind === 'artist' && artist"
    :artist="artist"
    :active="active"
    @pick="emit('pick')"
  />
  <SearchAlbumSuggestRow
    v-else-if="kind === 'album' && album"
    :album="album"
    :active="active"
    @pick="emit('pick')"
  />
  <SearchTrackSuggestRow
    v-else-if="kind === 'track' && track"
    :track="track"
    :active="active"
    @pick="emit('pick')"
  />
</template>
