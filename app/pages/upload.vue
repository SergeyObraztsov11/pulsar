<script setup lang="ts">
/**
 * Upload — создание альбома (редактор релиза → POST /api/albums).
 */
import type { Album } from "~/types/album";
import type { UploadTrackDraft } from "~/components/upload/UploadTrackRow.vue";
import { albumPath } from "~/utils/catalogPaths";
import { fetchErrorMessage } from "~/utils/apiErrorMessage";

definePageMeta({
  layout: "app-layout",
});

function emptyTrack(): UploadTrackDraft {
  return { name: "", audio: null, isExplicit: false };
}

const albumName = ref("");
const cover = ref<File | null>(null);
const tracks = ref<UploadTrackDraft[]>([emptyTrack()]);
const pending = ref(false);
const errorMessage = ref("");

const canSubmit = computed(() => {
  if (!albumName.value.trim()) return false;
  return tracks.value.some((track) => track.name.trim() && track.audio);
});

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
    const created = await $fetch<Album>("/api/albums", {
      method: "POST",
      body,
    });
    await navigateTo(albumPath(created));
  } catch (error) {
    errorMessage.value = fetchErrorMessage(error);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 animate-fade-up motion-reduce:animate-none sm:p-6"
  >
    <h1 class="text-2xl font-bold text-tone-white">Новый альбом</h1>

    <form
      class="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10"
      @submit.prevent="onSubmit"
    >
      <!-- Обложка -->
      <div class="w-full shrink-0 lg:w-72">
        <UploadCoverField v-model="cover" />
      </div>

      <!-- Мета + треки -->
      <div class="flex min-w-0 flex-1 flex-col gap-6">
        <UiTextField
          v-model.trim="albumName"
          placeholder="Название альбома"
        />

        <div class="flex flex-col gap-3">
          <UploadTrackRow
            v-for="(track, index) in tracks"
            :key="index"
            :track="track"
            :index="index"
            :can-remove="tracks.length > 1"
            :disabled="pending"
            @remove="removeTrack(index)"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <UiButton
            variant="gray"
            type="button"
            text="Добавить трек"
            icon="PlusSquare"
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

        <p v-if="errorMessage" class="text-sm text-danger">
          {{ errorMessage }}
        </p>
      </div>
    </form>
  </div>
</template>
