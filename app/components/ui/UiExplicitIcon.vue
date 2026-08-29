<script setup lang="ts">
/**
 * Метка explicit — WarningCircle справа от названия альбома / трека.
 */
import { PhWarningCircle } from "@phosphor-icons/vue";

withDefaults(
  defineProps<{
    /** Размер иконки (у заголовка страницы крупнее, у карточек — 16) */
    size?: number;
  }>(),
  { size: 16 },
);
</script>

<template>
  <span title="Контент для взрослых" class="inline-flex shrink-0">
    <PhWarningCircle
      :size="size"
      weight="bold"
      class="text-primary-gray"
      aria-hidden="true"
    />
  </span>
</template>
