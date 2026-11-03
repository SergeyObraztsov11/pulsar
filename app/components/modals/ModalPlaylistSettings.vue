<script lang="ts">
/**
 * ModalPlaylistSettings — name, description, cover, visibility.
 */
import { PhCamera, PhQueue } from "@phosphor-icons/vue";
import type { PlaylistDetail } from "~/types/playlist";
import { fetchErrorMessage } from "~/utils/apiErrorMessage";
import { toMediaSrc } from "~/utils/mediaSrc";

export type ModalPlaylistSettingsProps = {
  playlist: PlaylistDetail;
  onSaved: (playlist: PlaylistDetail) => void;
};
</script>

<script setup lang="ts">
const props = defineProps<ModalPlaylistSettingsProps>();

const { close } = useModal();
const { savePlaylistSettings } = usePlaylistSettings(props.playlist.id);

const initialName = props.playlist.name;
const initialDescription = (props.playlist.description ?? "").trim();
const initialIsPublic = props.playlist.isPublic;
const initialHasCover = Boolean(props.playlist.coverSrc);

const name = ref(props.playlist.name);
const description = ref(props.playlist.description ?? "");
const isPublic = ref(props.playlist.isPublic);
const coverFile = ref<File | null>(null);
const coverPreviewUrl = ref<string | null>(null);
const coverRemoved = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const trimmedName = computed(() => name.value.trim());
const trimmedDescription = computed(() => description.value.trim());

const isNameValid = computed(
  () => trimmedName.value.length > 0 && trimmedName.value.length <= 120,
);
const isDescriptionValid = computed(
  () => trimmedDescription.value.length <= 1000,
);

const metaDirty = computed(
  () =>
    trimmedName.value !== initialName ||
    trimmedDescription.value !== initialDescription ||
    isPublic.value !== initialIsPublic,
);

const coverDirty = computed(
  () => coverFile.value !== null || (coverRemoved.value && initialHasCover),
);

const isDirty = computed(() => metaDirty.value || coverDirty.value);

const canSave = computed(
  () =>
    isDirty.value &&
    isNameValid.value &&
    isDescriptionValid.value &&
    !saving.value,
);

const showCoverImage = computed(() => {
  if (coverPreviewUrl.value) return true;
  if (coverRemoved.value) return false;
  return Boolean(props.playlist.coverSrc);
});

const coverImageSrc = computed(() => {
  if (coverPreviewUrl.value) return coverPreviewUrl.value;
  if (coverRemoved.value) return null;
  return toMediaSrc(props.playlist.coverSrc);
});

const canRemoveCover = computed(
  () =>
    !coverRemoved.value &&
    (Boolean(coverFile.value) || initialHasCover) &&
    !saving.value,
);

function onClose() {
  close();
}

function onPickCover() {
  fileInput.value?.click();
}

function onCoverChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
  }

  coverFile.value = file;
  coverPreviewUrl.value = URL.createObjectURL(file);
  coverRemoved.value = false;
}

function onRemoveCover() {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
    coverPreviewUrl.value = null;
  }
  coverFile.value = null;
  coverRemoved.value = true;
}

onBeforeUnmount(() => {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
  }
});

async function onSave() {
  if (!canSave.value) return;
  errorMessage.value = null;
  saving.value = true;

  try {
    const patch: {
      name?: string;
      description?: string | null;
      isPublic?: boolean;
    } = {};

    if (trimmedName.value !== initialName) {
      patch.name = trimmedName.value;
    }
    if (trimmedDescription.value !== initialDescription) {
      patch.description = trimmedDescription.value || null;
    }
    if (isPublic.value !== initialIsPublic) {
      patch.isPublic = isPublic.value;
    }

    const summary = await savePlaylistSettings({
      patch: Object.keys(patch).length > 0 ? patch : undefined,
      coverFile: coverFile.value,
      removeCover: coverRemoved.value && initialHasCover && !coverFile.value,
    });

    if (summary) {
      props.onSaved({
        ...props.playlist,
        ...summary,
        tracks: props.playlist.tracks,
      });
    }

    close();
  } catch (error) {
    errorMessage.value = fetchErrorMessage(error);
    saving.value = false;
  }
}
</script>

<template>
  <ModalLayout title="Настройки плейлиста" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,26rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <!-- Обложка -->
      <div class="flex flex-col items-center gap-3">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onCoverChange"
        />

        <button
          type="button"
          class="group relative size-36 shrink-0 overflow-hidden rounded-md bg-tone-surface transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none"
          :disabled="saving"
          aria-label="Загрузить обложку"
          @click="onPickCover"
        >
          <img
            v-if="showCoverImage && coverImageSrc"
            :src="coverImageSrc"
            alt=""
            class="size-full object-cover"
          />
          <div
            v-else
            class="flex size-full items-center justify-center text-tone-muted"
          >
            <PhQueue :size="48" weight="light" />
          </div>

          <div
            class="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <PhCamera :size="28" weight="light" class="text-white" />
          </div>
        </button>

        <div class="flex flex-wrap items-center justify-center gap-2">
          <UiButton
            type="button"
            variant="gray"
            text="Загрузить"
            :disabled="saving"
            @click="onPickCover"
          />
          <UiButton
            v-if="canRemoveCover"
            type="button"
            variant="ghost"
            text="Удалить"
            :disabled="saving"
            @click="onRemoveCover"
          />
        </div>
      </div>

      <!-- Поля -->
      <UiTextField
        v-model="name"
        placeholder="Название"
        autocomplete="off"
        maxlength="120"
      />

      <div class="flex flex-col gap-1.5">
        <UiTextArea
          v-model="description"
          placeholder="Описание"
          hint="Необязательно"
          :rows="4"
          maxlength="1000"
        />
        <p class="text-right text-xs tabular-nums text-tone-muted">
          {{ trimmedDescription.length }} / 1000
        </p>
      </div>

      <!-- Видимость -->
      <div
        class="flex w-full items-center justify-between gap-4 rounded-md bg-tone-surface px-4 py-3"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium leading-none text-tone-white">
            Публичный плейлист
          </p>
          <p class="mt-1.5 text-xs leading-snug text-tone-muted">
            {{ isPublic ? "Доступен всем по ссылке" : "Виден только вам" }}
          </p>
        </div>

        <UiToggle
          v-model="isPublic"
          aria-label="Публичный плейлист"
          :disabled="saving"
        />
      </div>

      <p v-if="errorMessage" class="text-sm text-danger">
        {{ errorMessage }}
      </p>

      <div class="flex justify-end gap-2">
        <UiButton
          type="button"
          variant="ghost"
          text="Отмена"
          @click="onClose"
        />
        <UiButton
          type="submit"
          :variant="saving ? 'loading' : 'white'"
          text="Сохранить"
          :disabled="!canSave"
        />
      </div>
    </form>
  </ModalLayout>
</template>
