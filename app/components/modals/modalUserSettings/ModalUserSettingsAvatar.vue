<script lang="ts">
/**
 * Модалка настроек: загрузка / смена / удаление аватара.
 * После выбора файла — кадрирование (масштаб + сдвиг).
 */
import type { MeSettingsUser } from "./types";

export type ModalUserSettingsAvatarProps = {
  avatarSrc: string | null;
  name: string;
  onSaved: (user: MeSettingsUser) => void;
};
</script>

<script setup lang="ts">
import { PhUser } from "@phosphor-icons/vue";
import { fetchErrorMessage } from "~/utils/apiErrorMessage";
import { toMediaSrc } from "~/utils/mediaSrc";

const props = defineProps<ModalUserSettingsAvatarProps>();

const { close } = useModal();
const { fetch: refreshSession } = useUserSession();

const fileInput = ref<HTMLInputElement | null>(null);
const cropperRef = ref<{ getCroppedFile: () => Promise<File> } | null>(null);

const file = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const saving = ref(false);
const removing = ref(false);
const errorMessage = ref<string | null>(null);

/** Текущий аватар (без кадрирования), пока файл не выбран */
const currentAvatarSrc = computed(() => toMediaSrc(props.avatarSrc));

const canSave = computed(() => Boolean(file.value) && !saving.value);
const canRemove = computed(
  () => Boolean(props.avatarSrc) && !file.value && !removing.value,
);

/** Освободить object URL (не трогает ref, если не передан clear) */
function revokePreviewUrl(clear = true) {
  if (previewUrl.value?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }
  if (clear) previewUrl.value = null;
}

onBeforeUnmount(() => {
  revokePreviewUrl();
});

function onClose() {
  close();
}

function openFilePicker() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const next = input.files?.[0] ?? null;
  errorMessage.value = null;

  if (!next) return;
  if (!next.type.startsWith("image/")) {
    errorMessage.value = "Выберите изображение";
    input.value = "";
    return;
  }

  file.value = next;
  const previous = previewUrl.value;
  previewUrl.value = URL.createObjectURL(next);
  // Старый URL только после подмены — кроппер не остаётся с revoked src
  if (previous?.startsWith("blob:")) {
    URL.revokeObjectURL(previous);
  }
}

function clearPickedFile() {
  file.value = null;
  revokePreviewUrl();
  if (fileInput.value) fileInput.value.value = "";
}

async function onSave() {
  if (!file.value || saving.value || !cropperRef.value) return;
  errorMessage.value = null;
  saving.value = true;

  try {
    const cropped = await cropperRef.value.getCroppedFile("avatar.jpg");
    const body = new FormData();
    body.append("avatar", cropped);

    const user = await $fetch<MeSettingsUser>("/api/auth/me/avatar", {
      method: "POST",
      body,
    });
    await refreshSession();
    props.onSaved(user);
    close();
  } catch (error) {
    errorMessage.value = fetchErrorMessage(error, "Не удалось сохранить");
  } finally {
    saving.value = false;
  }
}

async function onRemove() {
  if (!canRemove.value) return;
  errorMessage.value = null;
  removing.value = true;

  try {
    const user = await $fetch<MeSettingsUser>("/api/auth/me/avatar", {
      method: "DELETE",
    });
    await refreshSession();
    props.onSaved(user);
    close();
  } catch (error) {
    errorMessage.value = fetchErrorMessage(error, "Не удалось удалить");
  } finally {
    removing.value = false;
  }
}
</script>

<template>
  <ModalLayout title="Изменить аватар" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <p class="text-sm text-tone-muted">
        Выберите фото, затем сдвиньте и масштабируйте кадр в круге.
      </p>

      <div class="flex flex-col items-center gap-4">
        <UiAvatarCropper
          v-if="previewUrl"
          ref="cropperRef"
          :src="previewUrl"
          :size="280"
          :output-size="512"
        />
        <div
          v-else
          class="relative size-[280px] shrink-0 overflow-hidden rounded-full bg-tone-surface"
        >
          <img
            v-if="currentAvatarSrc"
            :src="currentAvatarSrc"
            :alt="name"
            class="size-full object-cover"
          />
          <div
            v-else
            class="flex size-full items-center justify-center text-tone-white"
          >
            <PhUser :size="72" weight="light" />
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onFileChange"
        />

        <div class="flex flex-row flex-wrap items-center justify-center gap-2">
          <UiButton
            variant="gray"
            icon="UploadSimple"
            text="Выбрать фото"
            type="button"
            :disabled="saving || removing"
            @click="openFilePicker"
          />
          <UiButton
            v-if="file"
            variant="ghost"
            text="Сбросить"
            type="button"
            :disabled="saving || removing"
            @click="clearPickedFile"
          />
          <UiButton
            v-else-if="canRemove"
            variant="ghost"
            text="Удалить"
            type="button"
            :disabled="removing"
            @click="onRemove"
          />
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-danger">
        {{ errorMessage }}
      </p>

      <div class="flex justify-end gap-2">
        <UiButton
          :variant="saving ? 'loading' : 'white'"
          text="Сохранить"
          type="submit"
          :disabled="!canSave"
        />
      </div>
    </form>
  </ModalLayout>
</template>
