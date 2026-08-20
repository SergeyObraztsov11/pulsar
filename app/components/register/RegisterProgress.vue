<script setup lang="ts">
/**
 * RegisterProgress — сегменты шага, блик на текущем.
 */
const props = withDefaults(
  defineProps<{
    /** Индекс текущего шага, с нуля */
    current: number;
    total: number;
    /** Запрос уходит — блик по всей полоске */
    busy?: boolean;
    /** Подпись для screen reader */
    label?: string;
  }>(),
  {
    busy: false,
    label: "Шаг регистрации",
  },
);
</script>

<template>
  <!-- Прогресс шагов -->
  <div
    class="relative"
    role="progressbar"
    :aria-valuenow="props.current + 1"
    :aria-valuemin="1"
    :aria-valuemax="props.total"
    :aria-busy="props.busy"
    :aria-label="props.label"
  >
    <div class="flex gap-1">
      <div
        v-for="index in props.total"
        :key="index"
        class="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full"
        :class="
          index < props.current + 1 ||
          (props.busy && index === props.current + 1)
            ? 'bg-primary-white'
            : 'bg-primary-gray-dark'
        "
      >
        <div
          v-if="!props.busy && index === props.current + 1"
          class="absolute inset-y-0 left-0 w-2/3 bg-linear-to-r from-transparent via-primary-white to-transparent animate-progress-sheen motion-reduce:hidden"
        />
      </div>
    </div>
    <div
      v-if="props.busy"
      class="pointer-events-none absolute inset-0 overflow-hidden rounded-full motion-reduce:hidden"
    >
      <div
        class="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-primary-gray to-transparent animate-progress-sheen"
      />
    </div>
  </div>
</template>
