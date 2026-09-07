<script setup lang="ts">
/**
 * Маленький сайдбар библиотеки — колонка одинаковых кнопок.
 */
import {
  PhCaretRight,
  PhHouse,
  PhListHeart,
  PhMagnifyingGlass,
  PhPlus,
} from "@phosphor-icons/vue";

const emit = defineEmits<{
  expand: [];
  create: [];
}>();

/** Все кнопки рельсы — один стиль */
const railButtons = [
  {
    id: "expand",
    label: "Развернуть библиотеку",
    icon: PhCaretRight,
    action: () => emit("expand"),
  },
  {
    id: "create",
    label: "Создать",
    icon: PhPlus,
    action: () => emit("create"),
  },
  {
    id: "home",
    label: "Главная",
    icon: PhHouse,
    action: null,
  },
  {
    id: "search",
    label: "Поиск",
    icon: PhMagnifyingGlass,
    action: null,
  },
  {
    id: "likes",
    label: "Лайки",
    icon: PhListHeart,
    action: null,
  },
];
</script>

<template>
  <div class="flex h-full min-h-0 flex-col items-center gap-3 p-3">
    <button
      v-for="item in railButtons"
      :key="item.id"
      type="button"
      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-tone-surface transition-colors duration-200 hover:bg-tone-surface-hover hover:text-tone-muted motion-reduce:transition-none"
      :aria-label="item.label"
      @click="
        () => {
          if (item?.action) item.action();
        }
      "
    >
      <component :is="item.icon" size="18" weight="bold" />
    </button>
  </div>
</template>
