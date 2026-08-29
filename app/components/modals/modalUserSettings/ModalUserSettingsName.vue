<script lang="ts">
/**
 * Модалка настроек: имя.
 */
import type { MeSettingsUser } from "./types";

export type ModalUserSettingsNameProps = {
  name: string;
  onSaved: (user: MeSettingsUser) => void;
};
</script>

<script setup lang="ts">
import { patchMeSettings } from "./patchMeSettings";

const props = defineProps<ModalUserSettingsNameProps>();

const { close } = useModal();
const { fetch: refreshSession } = useUserSession();

const initialName = props.name.trim();
const name = ref(props.name);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const trimmed = computed(() => name.value.trim());
const isDirty = computed(() => trimmed.value !== initialName);
const isValid = computed(
  () => trimmed.value.length > 0 && trimmed.value.length <= 50,
);
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
  const result = await patchMeSettings({ name: trimmed.value });
  if (!result.ok) {
    errorMessage.value = result.message;
    saving.value = false;
    return;
  }

  await refreshSession();
  props.onSaved(result.user);
  saving.value = false;
  close();
}
</script>

<template>
  <ModalLayout title="Изменить имя" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <p class="text-sm text-primary-gray">
        Как вас будут знать на Pulsar — настоящее имя или творческий псевдоним.
      </p>

      <UiTextField
        v-model.trim="name"
        placeholder="Имя"
        maxlength="50"
        autocomplete="nickname"
      />

      <p v-if="errorMessage" class="text-sm text-danger">
        {{ errorMessage }}
      </p>

      <div class="flex flex-row justify-end">
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
