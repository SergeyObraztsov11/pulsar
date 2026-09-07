<script lang="ts">
/**
 * Модалка настроек: описание (bio).
 */
import type { MeSettingsUser } from "./types";

export type ModalUserSettingsBioProps = {
  bio: string | null;
  onSaved: (user: MeSettingsUser) => void;
};
</script>

<script setup lang="ts">
import { patchMeSettings } from "./patchMeSettings";

const props = defineProps<ModalUserSettingsBioProps>();

const { close } = useModal();

const initialBio = (props.bio ?? "").trim();
const bio = ref(props.bio ?? "");
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const trimmed = computed(() => bio.value.trim());
const isDirty = computed(() => trimmed.value !== initialBio);
const isValid = computed(() => trimmed.value.length <= 1000);
const canSave = computed(
  () => isDirty.value && isValid.value && !saving.value,
);

function onClose() {
  close();
}

async function onSave() {
  if (!canSave.value) return;
  errorMessage.value = null;

  saving.value = true;
  const result = await patchMeSettings({
    bio: trimmed.value || null,
  });
  if (!result.ok) {
    errorMessage.value = result.message;
    saving.value = false;
    return;
  }

  props.onSaved(result.user);
  saving.value = false;
  close();
}
</script>

<template>
  <ModalLayout title="Изменить описание" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <p class="text-sm text-tone-muted">
        Несколько слов о себе и о том, какую музыку вы делаете.
      </p>

      <UiTextArea
        v-model="bio"
        placeholder="Описание"
        hint="Несколько слов о себе и музыке"
        :rows="5"
        maxlength="1000"
      />

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
