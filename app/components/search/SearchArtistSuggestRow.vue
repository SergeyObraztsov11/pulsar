<script setup lang="ts">
/**
 * SearchArtistSuggestRow — артист в suggest: ссылка + like + more.
 */
import { PhDotsThree, PhHeart, PhUser } from "@phosphor-icons/vue";
import type { Artist, ArtistDetail } from "~/types/artist";
import ModalArtistMore, {
  type ModalArtistMoreProps,
} from "~/components/modals/ModalArtistMore.vue";

const props = defineProps<{
  artist: Artist;
  active?: boolean;
}>();

const { open: openModal } = useModal();
const { user } = useUserSession();

const {
  isLiked,
  moreOpen,
  isPlaying,
  artistTo,
  nameLabel,
  onPlayClick,
  toggleLike,
} = useArtistCard(() => props.artist);

const emit = defineEmits<{
  pick: [];
}>();

/** Модалка «О артисте» — детали подгружаем при открытии */
async function onAboutClick() {
  const id = props.artist.id;
  try {
    const detail = await $fetch<ArtistDetail>(`/api/artists/${id}`);
    openModal<ModalArtistMoreProps>({
      component: ModalArtistMore,
      props: {
        artistId: detail.id,
        artistName: detail.name,
        bio: detail.bio,
        country: detail.country,
        listenersCount: detail.listenersCount,
        albumCount: detail.albumCount,
        trackCount: detail.trackCount,
        links: detail.links,
        isOwnProfile: user.value?.id === detail.id,
      },
    });
  } catch {
    openModal<ModalArtistMoreProps>({
      component: ModalArtistMore,
      props: {
        artistId: id,
        artistName: nameLabel.value,
        isOwnProfile: user.value?.id === id,
      },
    });
  }
}

/** Поделиться ссылкой на артиста */
async function onShareClick() {
  const path = artistTo.value;
  const url =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const title = nameLabel.value;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // отмена share — clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // clipboard недоступен
  }
}
</script>

<template>
  <div
    class="group flex min-w-0 w-full flex-row items-center gap-3 p-2 text-tone-white transition-colors hover:bg-tone-surface-hover"
    :class="props.active ? 'bg-tone-surface-hover' : null"
    :aria-current="props.active ? 'true' : undefined"
  >
    <NuxtLink
      :to="artistTo"
      class="flex min-w-0 flex-1 items-center gap-3"
      @click="emit('pick')"
    >
      <div
        class="size-12 shrink-0 overflow-hidden rounded-full bg-tone-surface-hover"
      >
        <UiCoverImage
          :src="artist.avatarSrc"
          :alt="nameLabel"
          :icon="PhUser"
        />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-base font-medium leading-none">{{ nameLabel }}</p>
        <p class="mt-1 truncate text-sm leading-none text-tone-muted">
          Исполнитель
        </p>
      </div>
    </NuxtLink>

    <!-- mousedown.prevent — не сбрасывать фокус поля (иначе панель закроется) -->
    <div
      class="flex shrink-0 items-center gap-1"
      @click.stop
      @mousedown.prevent
    >
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center text-tone-white transition-colors hover:text-tone-muted"
        :aria-label="isLiked ? 'Убрать из любимого' : 'В любимое'"
        :aria-pressed="isLiked"
        @click="toggleLike"
      >
        <PhHeart :size="20" :weight="isLiked ? 'fill' : 'light'" />
      </button>

      <ArtistMoreMenu
        v-model:open="moreOpen"
        :is-liked="isLiked"
        :is-playing="isPlaying"
        @play="onPlayClick"
        @toggle-like="toggleLike"
        @about="onAboutClick"
        @share="onShareClick"
      >
        <template #trigger>
          <button
            type="button"
            class="flex size-8 shrink-0 items-center justify-center text-tone-white transition-colors hover:text-tone-muted"
            aria-label="Ещё"
          >
            <PhDotsThree :size="20" weight="light" />
          </button>
        </template>
      </ArtistMoreMenu>
    </div>
  </div>
</template>
