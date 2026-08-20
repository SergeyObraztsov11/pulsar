<script setup lang="ts">
/**
 * MenuSheetItem — строка sheet-меню (иконка / текст / chevron при children).
 */
import { PhCaretRight } from "@phosphor-icons/vue";
import type { MenuItem } from "./menu.types";

const props = defineProps<{
  /** Данные пункта */
  item: MenuItem;
}>();

const emit = defineEmits<{
  /** Клик по строке (родитель решает: drill-down / back / onClick) */
  select: [item: MenuItem];
}>();

/** Есть ли вложенный уровень (показать chevron) */
const hasSubmenu = computed(() => Boolean(props.item.children?.length));

/** Передать выбор родителю */
function onSelect() {
  emit("select", props.item);
}
</script>

<template>
  <button
    type="button"
    class="flex h-10 w-full items-center gap-3 text-left leading-none text-primary-white transition-colors active:text-accent"
    @click="onSelect"
  >
    <component
      :is="props.item.icon"
      v-if="props.item.icon"
      class="shrink-0"
      :class="props.item.iconClass"
      :size="24"
      :weight="props.item.iconWeight ?? 'light'"
    />
    <span class="text-xl" :class="props.item.labelClass">
      {{ props.item.label }}
    </span>
    <PhCaretRight
      v-if="hasSubmenu"
      class="shrink-0"
      :class="props.item.iconClass"
      :size="24"
      weight="light"
    />
  </button>
</template>
