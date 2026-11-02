<script setup lang="ts">
/**
 * Большой сайдбар библиотеки — шапка, поиск, фильтры, список с названиями.
 */
import {
  PhCaretDown,
  PhCaretLeft,
  PhListPlus,
  PhMagnifyingGlass,
  PhSortAscending,
  PhX,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { PlaylistSummary } from "~/types/playlist";

defineProps<{
  kind: "playlists" | "albums" | "artists";
  kindLabel: string;
  sortLabel: string;
  kindItems: MenuItem[];
  sortItems: MenuItem[];
  playlists: PlaylistSummary[];
  albums: Album[];
  artists: Artist[];
  loading?: boolean;
  listMessage?: string | null;
  activePlaylistId?: string | null;
  activeAlbumId?: string | null;
  activeArtistId?: string | null;
}>();

const kindOpen = defineModel<boolean>("kindOpen", { default: false });
const sortOpen = defineModel<boolean>("sortOpen", { default: false });
const searchQuery = defineModel<string>("searchQuery", { default: "" });

const emit = defineEmits<{
  collapse: [];
  create: [];
}>();
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 p-3">
    <div class="@container flex shrink-0 items-center gap-2">
      <h2 class="shrink-0 text-base font-bold">Библиотека</h2>

      <button
        type="button"
        class="ml-auto inline-flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-tone-surface text-sm font-medium leading-none transition-colors duration-200 hover:bg-tone-surface-hover motion-reduce:transition-none @[260px]:h-10 @[260px]:w-auto @[260px]:px-3"
        aria-label="Создать плейлист"
        @click="emit('create')"
      >
        <PhListPlus :size="16" weight="bold" />
        <span class="hidden @[260px]:inline">Создать</span>
      </button>

      <button
        type="button"
        class="flex size-10 shrink-0 items-center justify-center rounded-full bg-tone-surface transition-colors duration-200 hover:bg-tone-surface-hover hover:text-tone-muted motion-reduce:transition-none"
        aria-label="Свернуть библиотеку"
        @click="emit('collapse')"
      >
        <PhCaretLeft :size="18" weight="bold" />
      </button>
    </div>

    <div
      class="flex h-10 shrink-0 items-center gap-2 rounded-full bg-tone-surface px-3"
    >
      <PhMagnifyingGlass
        :size="18"
        weight="light"
        class="shrink-0 text-tone-muted"
      />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск в библиотеке"
        class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-tone-muted"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="shrink-0 text-tone-muted transition-colors hover:text-tone-white"
        aria-label="Очистить поиск"
        @click="searchQuery = ''"
      >
        <PhX :size="16" weight="light" />
      </button>
    </div>

    <div class="flex shrink-0 items-center justify-between">
      <MenuResponsive v-model:open="kindOpen" :items="kindItems">
        <template #trigger>
          <button
            type="button"
            class="inline-flex h-10 min-w-0 items-center gap-1.5 rounded-full px-2 text-sm font-medium leading-none text-tone-muted transition-colors duration-200 hover:text-tone-white motion-reduce:transition-none"
            :aria-label="`Раздел: ${kindLabel}`"
            :aria-expanded="kindOpen"
          >
            <span class="truncate">{{ kindLabel }}</span>
            <PhCaretDown :size="14" weight="bold" class="shrink-0" />
          </button>
        </template>
      </MenuResponsive>

      <MenuResponsive v-model:open="sortOpen" :items="sortItems">
        <template #trigger>
          <button
            type="button"
            class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-3 pr-1 text-sm leading-none text-tone-muted transition-colors duration-200 hover:text-tone-white motion-reduce:transition-none"
            :aria-label="`Сортировка: ${sortLabel}`"
            :aria-expanded="sortOpen"
          >
            {{ sortLabel }}
            <PhSortAscending :size="20" weight="light" class="shrink-0" />
          </button>
        </template>
      </MenuResponsive>
    </div>

    <!-- Список с названиями -->
    <div
      class="min-h-0 flex-1 overflow-y-auto [scrollbar-color:var(--color-tone-muted)_transparent] [scrollbar-width:thin]"
    >
      <div v-if="loading" class="flex flex-col gap-0.5" aria-busy="true">
        <div
          v-for="n in 5"
          :key="n"
          class="flex items-center gap-3 rounded-md p-2"
        >
          <div
            class="size-12 shrink-0 animate-pulse bg-tone-surface"
            :class="kind === 'artists' ? 'rounded-full' : 'rounded'"
          />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-3 w-2/3 animate-pulse rounded bg-tone-surface" />
            <div class="h-2.5 w-1/2 animate-pulse rounded bg-tone-surface" />
          </div>
        </div>
      </div>

      <p
        v-else-if="listMessage"
        class="px-2 py-6 text-sm text-tone-muted"
      >
        {{ listMessage }}
      </p>

      <ul
        v-else-if="kind === 'playlists'"
        class="flex flex-col gap-0.5"
      >
        <li v-for="playlist in playlists" :key="playlist.id">
          <AppLibraryPlaylistRow
            :playlist="playlist"
            :active="playlist.id === activePlaylistId"
          />
        </li>
      </ul>

      <ul v-else-if="kind === 'albums'" class="flex flex-col gap-0.5">
        <li v-for="album in albums" :key="album.id">
          <AppLibraryAlbumRow
            :album="album"
            :active="album.id === activeAlbumId"
          />
        </li>
      </ul>

      <ul v-else class="flex flex-col gap-0.5">
        <li v-for="artist in artists" :key="artist.id">
          <AppLibraryArtistRow
            :artist="artist"
            :active="artist.id === activeArtistId"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
