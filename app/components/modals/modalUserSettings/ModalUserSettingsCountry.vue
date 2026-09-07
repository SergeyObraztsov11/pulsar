<script lang="ts">
/**
 * Модалка настроек: страна.
 */
import type { MeSettingsUser } from "./types";

export type ModalUserSettingsCountryProps = {
  country: string | null;
  onSaved: (user: MeSettingsUser) => void;
};
</script>

<script setup lang="ts">
import { patchMeSettings } from "./patchMeSettings";

const props = defineProps<ModalUserSettingsCountryProps>();

const { close } = useModal();

const initialCountry = (props.country ?? "").trim();
const country = ref(props.country ?? "");
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const trimmed = computed(() => country.value.trim());
const isDirty = computed(() => trimmed.value !== initialCountry);
const isValid = computed(() => trimmed.value.length <= 80);
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
    country: trimmed.value || null,
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
  <ModalLayout title="Изменить страну" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <p class="text-sm text-tone-muted">
        Город или страна, с которыми вы себя связываете.
      </p>

      <UiTextField
        v-model.trim="country"
        placeholder="Страна"
        maxlength="80"
        autocomplete="country-name"
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
