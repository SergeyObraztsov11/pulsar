<script lang="ts">
/**
 * Модалка настроек: дата рождения.
 */
import type { MeSettingsUser } from "./types";

export type ModalUserSettingsBirthDateProps = {
  birthDate: string | null;
  onSaved: (user: MeSettingsUser) => void;
};
</script>

<script setup lang="ts">
import { patchMeSettings } from "./patchMeSettings";

const MONTHS = [
  { value: "01", label: "Январь" },
  { value: "02", label: "Февраль" },
  { value: "03", label: "Март" },
  { value: "04", label: "Апрель" },
  { value: "05", label: "Май" },
  { value: "06", label: "Июнь" },
  { value: "07", label: "Июль" },
  { value: "08", label: "Август" },
  { value: "09", label: "Сентябрь" },
  { value: "10", label: "Октябрь" },
  { value: "11", label: "Ноябрь" },
  { value: "12", label: "Декабрь" },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

const props = defineProps<ModalUserSettingsBirthDateProps>();

const { close } = useModal();

const initial = birthPartsFromIso(props.birthDate);
const day = ref(initial.day);
const month = ref(initial.month);
const year = ref(initial.year);

const saving = ref(false);
const errorMessage = ref<string | null>(null);

const daysInMonth = computed(() => {
  const m = Number(month.value);
  const y = Number(year.value);
  if (!m) return 31;
  const yearForDays =
    Number.isInteger(y) && y >= MIN_YEAR && y <= CURRENT_YEAR ? y : 2024;
  return new Date(yearForDays, m, 0).getDate();
});

const dayOptions = computed(() =>
  Array.from({ length: daysInMonth.value }, (_, index) => {
    const value = String(index + 1).padStart(2, "0");
    return { value, label: String(index + 1) };
  }),
);

const yearOptions = Array.from(
  { length: CURRENT_YEAR - MIN_YEAR + 1 },
  (_, index) => {
    const value = String(CURRENT_YEAR - index);
    return { value, label: value };
  },
);

watch([month, year, daysInMonth], () => {
  if (!day.value) return;
  if (Number(day.value) > daysInMonth.value) day.value = "";
});

/** День / месяц / год из ISO даты (UTC) */
function birthPartsFromIso(iso: string | null) {
  if (!iso) return { day: "", month: "", year: "" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: "", month: "", year: "" };
  return {
    day: String(date.getUTCDate()).padStart(2, "0"),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    year: String(date.getUTCFullYear()),
  };
}

const isDirty = computed(
  () =>
    day.value !== initial.day ||
    month.value !== initial.month ||
    year.value !== initial.year,
);

/** Полная дата обязательна */
const isValid = computed(
  () => Boolean(day.value) && Boolean(month.value) && Boolean(year.value),
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
  const result = await patchMeSettings({
    day: day.value,
    month: month.value,
    year: year.value,
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
  <ModalLayout title="Изменить дату рождения" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <p class="text-sm text-tone-muted">
        Укажите дату полностью — день, месяц и год.
      </p>

      <div class="flex w-full flex-row gap-2">
        <UiSelectField
          v-model="day"
          class="w-full sm:w-24 sm:shrink-0"
          placeholder="День"
          :options="dayOptions"
        />
        <UiSelectField
          v-model="month"
          class="min-w-0 w-full flex-1"
          placeholder="Месяц"
          :options="[...MONTHS]"
        />
        <UiSelectField
          v-model="year"
          class="w-full sm:w-28 sm:shrink-0"
          placeholder="Год"
          :options="yearOptions"
        />
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
