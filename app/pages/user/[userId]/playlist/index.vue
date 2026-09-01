<script setup lang="ts">
/**
 * Плейлисты пользователя — сетка PlaylistCard.
 * Данные: GET /api/playlists (только свой список; чужие — позже через публичные).
 */
import { ApiErrorCode } from "#shared/apiErrorCodes";
import type { PlaylistSummary } from "~/types/playlist";

definePageMeta({
  layout: "app-layout",
  key: (route) => `playlists-${route.params.userId}`,
});

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ""));
const { user } = useUserSession();

if (!user.value?.id) {
  throw createError({
    statusCode: 401,
    statusMessage: ApiErrorCode.AUTHENTICATION_REQUIRED,
    fatal: true,
  });
}

if (user.value.id !== userId.value) {
  throw createError({
    statusCode: 403,
    statusMessage: ApiErrorCode.FORBIDDEN,
    fatal: true,
  });
}

const { data: playlists, error } = await useFetch<PlaylistSummary[]>(
  "/api/playlists",
  { key: computed(() => `playlists:${userId.value}`) },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 401,
    statusMessage:
      error.value.statusMessage ?? ApiErrorCode.AUTHENTICATION_REQUIRED,
    fatal: true,
  });
}

const isLoading = computed(() => playlists.value == null);
const isEmpty = computed(
  () => !isLoading.value && (playlists.value?.length ?? 0) === 0,
);
</script>

<template>
  <div class="flex flex-col gap-10 animate-fade-up motion-reduce:animate-none">
    <header class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-primary-white">Плейлисты</h1>
      <p class="text-sm text-primary-gray">
        «Мне нравится» и созданные плейлисты.
      </p>
    </header>

    <div v-if="isLoading" class="flex flex-row flex-wrap gap-6">
      <PlaylistCardSkeleton v-for="n in 6" :key="n" />
    </div>

    <p v-else-if="isEmpty" class="text-base text-primary-gray">
      Плейлистов пока нет. Добавляйте треки через меню «⋯» на карточке трека.
    </p>

    <div v-else class="flex flex-row flex-wrap gap-6">
      <PlaylistCard
        v-for="playlist in playlists"
        :key="playlist.id"
        :playlist="playlist"
      />
    </div>
  </div>
</template>
