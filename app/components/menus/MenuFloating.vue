<script setup lang="ts">
/**
 * MenuFloating — десктопное выпадающее меню (Teleport + Floating UI).
 * Только items; выбор листа → onClick + закрытие.
 */
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import {
  MENU_FLOATING_PANEL_CLASS,
  type MenuItem,
} from "./menu.types";
import { useMenuCloseOnHidden } from "./useMenuCloseOnHidden";

/** Открыто ли меню (v-model:open) */
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  /** Пункты меню */
  items: MenuItem[];
}>();

/** Якорь триггера для Floating UI */
const reference = ref<HTMLElement | null>(null);
/** DOM панели меню */
const floating = ref<HTMLElement | null>(null);

/** Стили позиции панели от Floating UI */
const { floatingStyles } = useFloating(reference, floating, {
  placement: "bottom-end",
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
  middleware: [offset(8), flip(), shift({ padding: 8 })],
});

useMenuCloseOnHidden(reference, open);

onClickOutside(
  floating,
  () => {
    open.value = false;
  },
  {
    ignore: [reference, "[data-menu-floating-panel]"],
  },
);

/** Открыть / закрыть по клику на триггер */
function toggle() {
  open.value = !open.value;
}

/**
 * Выбор пункта: родители с children игнорируем (flyout),
 * лист вызывает onClick и закрывает меню.
 */
function onSelect(item: MenuItem) {
  if (item.children?.length) return;
  item.onClick?.();
  open.value = false;
}
</script>

<template>
  <!-- Триггер -->
  <div ref="reference" class="inline-flex">
    <div @click.stop="toggle">
      <slot name="trigger" :open="open" />
    </div>
  </div>

  <!-- Панель -->
  <Teleport to="body">
    <div
      v-if="open"
      ref="floating"
      data-menu-floating-panel
      :style="floatingStyles"
      :class="MENU_FLOATING_PANEL_CLASS"
    >
      <div class="flex flex-col">
        <MenuFloatingItem
          v-for="item in props.items"
          :key="item.id"
          :item="item"
          @select="onSelect"
        />
      </div>
    </div>
  </Teleport>
</template>
