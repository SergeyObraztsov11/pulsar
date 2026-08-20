<script setup lang="ts">
/**
 * RegisterStepPersonal — дата рождения и пол (всё через выбор).
 */
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

const GENDERS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
  { value: "unspecified", label: "Не указывать" },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

const day = defineModel<string>("day", { default: "" });
const month = defineModel<string>("month", { default: "" });
const year = defineModel<string>("year", { default: "" });
const gender = defineModel<string>("gender", { default: "" });

const dayField = useTemplateRef<{ focus: () => void }>("dayField");
const monthField = useTemplateRef<{ focus: () => void }>("monthField");
const yearField = useTemplateRef<{ focus: () => void }>("yearField");
const genderField = useTemplateRef<{ focus: () => void }>("genderField");

/** Сколько дней в выбранном месяце/годе (без месяца — 31) */
const daysInMonth = computed(() => {
  const m = Number(month.value);
  const y = Number(year.value);
  if (!m) return 31;
  const yearForDays =
    Number.isInteger(y) && y >= MIN_YEAR && y <= CURRENT_YEAR
      ? y
      : 2024;
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

/** Если день стал невалиден после смены месяца/года — сбрасываю */
watch([month, year, daysInMonth], () => {
  if (!day.value) return;
  if (Number(day.value) > daysInMonth.value) day.value = "";
});

watch(day, (value) => {
  if (value) monthField.value?.focus();
});

watch(month, (value) => {
  if (value) yearField.value?.focus();
});

watch(year, (value) => {
  if (value) genderField.value?.focus();
});

onMounted(() => {
  dayField.value?.focus();
});
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <!-- Дата рождения: день / месяц / год -->
    <div class="flex w-full flex-row gap-2">
      <UiSelectField
        ref="dayField"
        v-model="day"
        class="w-full sm:w-24 sm:shrink-0"
        name="bday-day"
        autocomplete="bday-day"
        placeholder="День"
        :options="dayOptions"
      />
      <UiSelectField
        ref="monthField"
        v-model="month"
        class="min-w-0 w-full flex-1"
        name="bday-month"
        autocomplete="bday-month"
        placeholder="Месяц"
        :options="[...MONTHS]"
      />
      <UiSelectField
        ref="yearField"
        v-model="year"
        class="w-full sm:w-28 sm:shrink-0"
        name="bday-year"
        autocomplete="bday-year"
        placeholder="Год"
        :options="yearOptions"
      />
    </div>

    <UiSelectField
      ref="genderField"
      v-model="gender"
      name="sex"
      autocomplete="sex"
      placeholder="Пол"
      :options="[...GENDERS]"
    />
  </div>
</template>
