<script setup lang="ts">
/**
 * Плейлист — шапка и треклист.
 * Данные: GET /api/playlists/:id; владелец — GET /api/artists/:ownerId (lazy).
 */
import { PhListHeart, PhQueue, PhUser } from "@phosphor-icons/vue";
import ModalPlaylistSettings, {
  type ModalPlaylistSettingsProps,
} from "~/components/modals/ModalPlaylistSettings.vue";
import type { ArtistDetail } from "~/types/artist";
import { ApiErrorCode } from "#shared/apiErrorCodes";
import type { PlaylistDetail } from "~/types/playlist";
import { isSameQueueSource } from "~/stores/player";
import { formatDurationRu } from "~/utils/formatDuration";
import { formatUpdatedAtLabel } from "~/utils/formatUpdatedAt";
import { formatCountRu } from "~/utils/pluralizeRu";

definePageMeta({
  layout: "app-layout",
  key: (route) => `playlist-${route.params.userId}-${route.params.playlistId}`,
});

const route = useRoute();
const playlistId = computed(() => String(route.params.playlistId ?? ""));
const { user } = useUserSession();

const { data: playlist, error } = await useFetch<PlaylistDetail>(
  () => `/api/playlists/${playlistId.value}`,
  { key: computed(() => `playlist:${playlistId.value}`) },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: error.value.statusMessage ?? ApiErrorCode.PLAYLIST_NOT_FOUND,
    fatal: true,
  });
}

const isOwnPlaylist = computed(
  () =>
    Boolean(user.value?.id) &&
    Boolean(playlist.value?.userId) &&
    user.value?.id === playlist.value?.userId,
);

const canEditPlaylist = computed(
  () => isOwnPlaylist.value && !playlist.value?.isSystem,
);

const { open: openModal } = useModal();

const ownerId = computed(() => playlist.value?.userId ?? "");

const { data: owner } = await useFetch<ArtistDetail>(
  () => `/api/artists/${ownerId.value}`,
  {
    key: computed(() => `artist:${ownerId.value}`),
    lazy: true,
    watch: [ownerId],
  },
);

const ownerTo = computed(() => `/user/${ownerId.value}`);

const coverIcon = computed(() =>
  playlist.value?.systemKind === "liked_tracks" ? PhListHeart : PhQueue,
);

const updatedAtLabel = computed(() =>
  formatUpdatedAtLabel(playlist.value?.updatedAt),
);

const trackCountLabel = computed(() => {
  const count = playlist.value?.trackCount ?? 0;
  return formatCountRu(count, "трек", "трека", "треков");
});

const totalDurationSec = computed(() =>
  (playlist.value?.tracks ?? []).reduce(
    (sum, track) => sum + (track.durationSec ?? 0),
    0,
  ),
);

const totalDurationLabel = computed(() =>
  formatDurationRu(totalDurationSec.value),
);

const playerStore = usePlayerStore();

const isCurrentPlaylist = computed(() => {
  const id = playlist.value?.id;
  if (!id) return false;
  return isSameQueueSource(playerStore.queueSource, {
    type: "playlist",
    id,
  });
});

const isPlayingPlaylist = computed(
  () => isCurrentPlaylist.value && playerStore.isPlaying,
);

const headerWashStyle = {
  backgroundImage: `radial-gradient(ellipse 120% 100% at 50% 0%, var(--color-primary-gray) 0%, transparent 75%)`,
};

function onListenClick() {
  const detail = playlist.value;
  if (!detail) return;
  if (isCurrentPlaylist.value) {
    playerStore.togglePlaying();
    return;
  }
  const first = detail.tracks.find((track) => Boolean(track.audioSrc));
  if (!first) return;
  playerStore.play(first, detail.tracks, {
    type: "playlist",
    id: detail.id,
    title: detail.name,
  });
}

function onPlaylistSaved(next: PlaylistDetail) {
  playlist.value = next;
}

function onSettingsClick() {
  const detail = playlist.value;
  if (!detail || !canEditPlaylist.value) return;

  openModal<ModalPlaylistSettingsProps>({
    component: ModalPlaylistSettings,
    props: {
      playlist: detail,
      onSaved: onPlaylistSaved,
    },
  });
}
</script>

<template>
  <div class="relative flex flex-col">
    <!-- Wash -->
    <div
      class="pointer-events-none absolute -top-24 left-1/2 z-0 h-140 w-screen -translate-x-1/2 overflow-hidden lg:h-96"
      aria-hidden="true"
    >
      <div
        class="absolute -inset-16 opacity-70 blur-3xl motion-reduce:blur-none motion-reduce:opacity-45"
        :style="headerWashStyle"
      />
    </div>

    <!-- Шапка -->
    <header
      class="relative z-10 flex flex-col items-center gap-4 animate-fade-up motion-reduce:animate-none lg:flex-row lg:items-stretch lg:gap-6"
    >
      <div
        class="size-36 shrink-0 overflow-hidden rounded-xl bg-primary-gray-dark sm:size-52 lg:size-64"
      >
        <UiCoverImage
          :src="playlist?.coverSrc"
          :alt="playlist?.name"
          :icon="coverIcon"
          :icon-size="40"
        />
      </div>

      <div
        class="flex w-full min-w-0 max-w-sm flex-col items-center gap-3 text-center sm:max-w-md lg:min-h-64 lg:max-w-none lg:flex-1 lg:items-start lg:text-left"
      >
        <div
          class="flex w-full min-w-0 flex-col items-center lg:flex-1 lg:items-start lg:justify-center"
        >
          <h1
            class="min-w-0 max-w-full text-5xl font-bold leading-none wrap-break-word text-primary-white lg:truncate lg:break-normal"
          >
            {{ playlist?.name }}
          </h1>
          <p
            v-if="playlist?.description"
            class="mt-3 max-w-full text-sm text-primary-gray lg:mt-2"
          >
            {{ playlist.description }}
          </p>
        </div>

        <!-- Mobile: владелец отдельной строкой -->
        <NuxtLink
          :to="ownerTo"
          class="inline-flex min-w-0 max-w-full flex-row items-center gap-2 text-sm text-primary-gray hover:text-primary-white lg:hidden"
        >
          <div
            v-if="owner?.avatarSrc"
            class="size-7 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
          >
            <UiCoverImage
              :src="owner.avatarSrc"
              :icon="PhUser"
              :alt="owner.name"
              :icon-size="55"
            />
          </div>
          <span class="truncate">
            {{ owner?.name ?? "…" }}
          </span>
        </NuxtLink>

        <div
          class="flex max-w-full flex-row flex-wrap items-center justify-center gap-x-1.5 text-sm text-primary-gray lg:justify-start"
        >
          <!-- Desktop: владелец в строке меты -->
          <NuxtLink
            :to="ownerTo"
            class="hidden min-w-0 max-w-full flex-row items-center gap-1.5 lg:inline-flex"
          >
            <div
              v-if="owner?.avatarSrc"
              class="size-6 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
            >
              <UiCoverImage
                :src="owner.avatarSrc"
                :icon="PhUser"
                :alt="owner.name"
                :icon-size="55"
              />
            </div>
            <span class="truncate font-bold text-primary-gray hover:text-primary-white">
              {{ owner?.name ?? "…" }}
            </span>
          </NuxtLink>
          <span class="hidden lg:inline" aria-hidden="true">·</span>
          <span v-if="updatedAtLabel">{{ updatedAtLabel }}</span>
          <span v-if="updatedAtLabel" aria-hidden="true">·</span>
          <span>{{ trackCountLabel }}</span>
          <template v-if="totalDurationLabel">
            <span aria-hidden="true">·</span>
            <span>{{ totalDurationLabel }}</span>
          </template>
        </div>

        <div
          class="flex flex-row items-center justify-center gap-2 sm:gap-3 lg:justify-start"
        >
          <UiButton
            :icon="isPlayingPlaylist ? 'Pause' : 'Play'"
            filled
            variant="white"
            :text="isPlayingPlaylist ? 'Пауза' : 'Слушать'"
            @click="onListenClick"
          />
          <UiButton
            v-if="canEditPlaylist"
            variant="gray"
            text="Настройки"
            @click="onSettingsClick"
          />
        </div>
      </div>
    </header>

    <!-- Треклист -->
    <div
      class="relative z-10 flex flex-col gap-10 lg:gap-16"
      :class="isOwnPlaylist ? 'mt-6' : 'mt-10 lg:mt-16'"
    >
      <TracksColumnSection
        variant="cover"
        :items="playlist?.tracks ?? null"
        :limit="playlist?.tracks.length ?? 0"
        :queue-source="
          playlist?.id
            ? { type: 'playlist', id: playlist.id, title: playlist.name }
            : null
        "
      />
    </div>
  </div>
</template>
