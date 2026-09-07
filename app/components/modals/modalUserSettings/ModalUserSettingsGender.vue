<script lang="ts">
/**
 * Модалка настроек: пол.
 */
import type { MeSettingsUser } from "./types";

export type ModalUserSettingsGenderProps = {
  gender: string | null;
  onSaved: (user: MeSettingsUser) => void;
};
</script>

<script setup lang="ts">
import { patchMeSettings } from "./patchMeSettings";

const GENDERS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
  { value: "unspecified", label: "Не указывать" },
] as const;

const props = defineProps<ModalUserSettingsGenderProps>();

const { close } = useModal();

const initialGender = props.gender ?? "";
const gender = ref(initialGender);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const isDirty = computed(() => gender.value !== initialGender);
const isValid = computed(() => Boolean(gender.value));
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
    gender: gender.value || null,
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
  <ModalLayout title="Изменить пол" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <p class="text-sm text-tone-muted">
        Выберите вариант, который вам подходит.
      </p>

      <UiSelectField
        v-model="gender"
        placeholder="Пол"
        :options="[...GENDERS]"
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
