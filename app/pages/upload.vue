<script setup lang="ts">
/**
 * Upload — тестовая форма создания альбома (multipart → POST /api/albums).
 */
import type { Album } from "~/types/album";
import { albumPath } from "~/utils/catalogPaths";

definePageMeta({
  layout: "app-layout",
});

type TrackDraft = {
  name: string;
  audio: File | null;
  isExplicit: boolean;
};

function emptyTrack(): TrackDraft {
  return { name: "", audio: null, isExplicit: false };
}

const albumName = ref("");
const cover = ref<File | null>(null);
const tracks = ref<TrackDraft[]>([emptyTrack()]);
const pending = ref(false);
const errorMessage = ref("");
const createdAlbum = ref<Album | null>(null);

const canSubmit = computed(() => {
  if (!albumName.value.trim()) return false;
  return tracks.value.some((track) => track.name.trim() && track.audio);
});

/** Текст ошибки $fetch */
function errorText(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (
      error as { data?: { statusMessage?: string; message?: string } }
    ).data;
    if (data?.statusMessage) return data.statusMessage;
    if (data?.message) return data.message;
  }
  return "Не получилось. Попробуйте ещё раз.";
}

function onCoverChange(event: Event) {
  const input = event.target as HTMLInputElement;
  cover.value = input.files?.[0] ?? null;
}

function onAudioChange(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  const track = tracks.value[index];
  if (!track) return;
  track.audio = file;
  if (file && !track.name.trim()) {
    track.name = file.name.replace(/\.[^.]+$/, "");
  }
}

function addTrack() {
  tracks.value.push(emptyTrack());
}

function removeTrack(index: number) {
  if (tracks.value.length === 1) return;
  tracks.value.splice(index, 1);
}

async function onSubmit() {
  if (!canSubmit.value || pending.value) return;
  errorMessage.value = "";
  createdAlbum.value = null;
  pending.value = true;

  const body = new FormData();
  body.append("name", albumName.value.trim());
  if (cover.value) body.append("cover", cover.value);

  tracks.value.forEach((track, i) => {
    if (!track.name.trim() && !track.audio) return;
    body.append(`tracks[${i}][name]`, track.name.trim());
    if (track.audio) body.append(`tracks[${i}][audio]`, track.audio);
    if (track.isExplicit) {
      body.append(`tracks[${i}][isExplicit]`, "true");
    }
  });

  try {
    createdAlbum.value = await $fetch<Album>("/api/albums", {
      method: "POST",
      body,
    });
  } catch (error) {
    errorMessage.value = errorText(error);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="flex max-w-xl flex-col gap-8">
    <h1 class="text-2xl font-bold text-primary-white">Upload</h1>
    <p class="text-sm text-primary-gray">
      Тест POST /api/albums. Обложка (любая картинка) → WebP. Треки MP3 ≤30MB.
    </p>

    <form class="flex flex-col gap-6" @submit.prevent="onSubmit">
      <UiTextField v-model.trim="albumName" placeholder="Название альбома" />

      <label class="flex flex-col gap-2 text-sm text-primary-gray">
        Обложка (необязательно)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
          @change="onCoverChange"
        />
      </label>

      <!-- Треки -->
      <div
        v-for="(track, index) in tracks"
        :key="index"
        class="flex flex-col gap-3 border-t border-primary-gray-dark pt-4"
      >
        <p class="text-sm text-primary-white">Трек {{ index + 1 }}</p>
        <UiTextField v-model.trim="track.name" placeholder="Название трека" />
        <label class="flex flex-col gap-2 text-sm text-primary-gray">
          MP3
          <input
            type="file"
            accept="audio/mpeg,.mp3"
            @change="onAudioChange(index, $event)"
          />
        </label>
        <label class="flex items-center gap-2 text-sm text-primary-gray">
          <input v-model="track.isExplicit" type="checkbox" />
          Explicit
        </label>
        <UiButton
          v-if="tracks.length > 1"
          variant="ghost"
          type="button"
          text="Убрать трек"
          :disabled="pending"
          @click="removeTrack(index)"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <UiButton
          variant="outline"
          type="button"
          text="Ещё трек"
          :disabled="pending"
          @click="addTrack"
        />
        <UiButton
          type="submit"
          :text="pending ? undefined : 'Создать альбом'"
          :variant="pending ? 'loading' : 'white'"
          :disabled="!canSubmit || pending"
        />
      </div>
    </form>

    <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
    <p v-if="createdAlbum" class="text-sm text-primary-white">
      Альбом создан:
      <NuxtLink
        :to="albumPath(createdAlbum)"
        class="hover:text-accent"
      >
        {{ createdAlbum.name }}
      </NuxtLink>
    </p>
  </div>
</template>
