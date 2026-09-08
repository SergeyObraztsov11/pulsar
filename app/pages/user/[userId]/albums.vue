<script setup lang="ts">
/**
 * Все альбомы артиста.
 * Данные: GET /api/artists/:id.
 * Тонкая sticky-шапка: аватар + ник, фон от avatarColor, кнопка наверх.
 */
import { PhCaretUp, PhUser } from "@phosphor-icons/vue";
import type { ArtistDetail } from "~/types/artist";
import { ApiErrorCode } from "#shared/apiErrorCodes";

definePageMeta({
  layout: "app-layout",
  pageTransition: false,
  key: (route) => `artist-albums-${route.params.userId}`,
});

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ""));

const { data: artist, error } = await useFetch<ArtistDetail>(
  () => `/api/artists/${userId.value}`,
  { key: computed(() => `artist:${userId.value}`) },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: error.value.statusMessage ?? ApiErrorCode.ARTIST_NOT_FOUND,
    fatal: true,
  });
}

const artistTo = computed(() =>
  artist.value?.id ? `/user/${artist.value.id}` : "/",
);

const headerRef = ref<HTMLElement | null>(null);

/** Accent из аватара; fallback — coverColor первого альбома */
const headerColor = computed(() => {
  const fromAvatar = artist.value?.avatarColor?.trim();
  if (fromAvatar && /^#[0-9a-fA-F]{6}$/.test(fromAvatar)) return fromAvatar;
  const fromAlbum = artist.value?.albums?.[0]?.coverColor?.trim();
  if (fromAlbum && /^#[0-9a-fA-F]{6}$/.test(fromAlbum)) return fromAlbum;
  return null;
});

const headerBgStyle = computed(() => {
  const color = headerColor.value;
  if (!color) return undefined;
  return {
    backgroundImage: `linear-gradient(to bottom, ${color} 0%, color-mix(in srgb, ${color} 55%, var(--color-tone-canvas)) 100%)`,
  };
});

/** Листать main вверх */
function scrollToTop() {
  const scrollRoot = headerRef.value?.closest("main");
  scrollRoot?.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <div>
    <!-- Тонкая sticky-шапка: аватар + ник · Альбомы | наверх -->
    <header
      ref="headerRef"
      class="sticky top-0 z-12 flex shrink-0 items-center gap-3 overflow-hidden rounded-t-lg px-4 py-3 text-tone-white lg:px-6"
      :class="headerBgStyle ? null : 'bg-tone-surface'"
      :style="headerBgStyle"
    >
      <NuxtLink
        :to="artistTo"
        class="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
      >
        <div
          class="size-10 shrink-0 overflow-hidden rounded-full bg-tone-shell shadow-md"
        >
          <UiCoverImage
            :src="artist?.avatarSrc"
            :icon="PhUser"
            :alt="artist?.name ?? 'Исполнитель'"
          />
        </div>
        <span class="truncate text-base font-bold leading-none">
          {{ artist?.name ?? "…" }}
        </span>
      </NuxtLink>

      <span class="shrink-0 text-tone-white" aria-hidden="true">·</span>

      <h1
        class="min-w-0 flex-1 truncate text-base font-medium leading-none text-tone-white"
      >
        Альбомы
      </h1>

      <button
        type="button"
        class="text-tone-white transition-colors duration-200 hover:text-tone-muted"
        aria-label="Наверх"
        @click="scrollToTop"
      >
        <PhCaretUp :size="24" weight="bold" />
      </button>
    </header>

    <section class="flex flex-col gap-6 p-6">
      <AlbumsGrid :items="artist?.albums ?? []" :show-artist="false" />
    </section>
  </div>
</template>
