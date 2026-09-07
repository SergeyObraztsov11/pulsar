<script setup lang="ts">
/**
 * MenuResponsive — на lg показывает MenuFloating, иначе MenuSheet.
 * Только переключение breakpoint; API items одинаковый.
 */
import type { MenuItem } from "./menu.types";

/** Открыто ли меню (v-model:open) */
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  /** Пункты меню */
  items: MenuItem[];
}>();

/** Desktop (Tailwind lg): floating, иначе sheet */
const isLgUp = useLgUp();
</script>

<template>
  <MenuFloating
    v-if="isLgUp"
    v-model:open="open"
    :items="props.items"
  >
    <template #trigger="slotProps">
      <slot name="trigger" v-bind="slotProps" />
    </template>
  </MenuFloating>

  <MenuSheet
    v-else
    v-model:open="open"
    :items="props.items"
  >
    <template #trigger="slotProps">
      <slot name="trigger" v-bind="slotProps" />
    </template>
  </MenuSheet>
</template>
