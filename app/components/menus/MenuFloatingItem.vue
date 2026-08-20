<script setup lang="ts">
/**
 * MenuFloatingItem — строка floating-меню; при children — flyout по hover.
 */
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue";
import { PhCaretRight } from "@phosphor-icons/vue";
import {
  MENU_FLOATING_PANEL_CLASS,
  type MenuItem,
} from "./menu.types";

const props = defineProps<{
  /** Данные пункта */
  item: MenuItem;
}>();

const emit = defineEmits<{
  /** Выбран лист (без children) */
  select: [item: MenuItem];
}>();

/** Есть ли вложенное подменю */
const hasSubmenu = computed(() => Boolean(props.item.children?.length));
/** Открыт ли flyout */
const submenuOpen = ref(false);
/** Якорь строки для позиционирования flyout */
const reference = ref<HTMLElement | null>(null);
/** DOM панели flyout */
const floating = ref<HTMLElement | null>(null);
/** Таймер отложенного закрытия flyout при уходе курсора */
let closeTimer: ReturnType<typeof setTimeout> | null = null;

/** Стили позиции flyout */
const { floatingStyles } = useFloating(reference, floating, {
  placement: "right-start",
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
  middleware: [offset(4), flip(), shift({ padding: 8 })],
});

/** Открыть flyout (и отменить отложенное закрытие) */
function openSubmenu() {
  if (!hasSubmenu.value) return;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  submenuOpen.value = true;
}

/** Закрыть flyout с небольшой задержкой (чтобы успеть навести на панель) */
function scheduleCloseSubmenu() {
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    submenuOpen.value = false;
    closeTimer = null;
  }, 150);
}

/** Клик по строке: только лист → select; родители открываются hover */
function onSelect() {
  if (hasSubmenu.value) return;
  emit("select", props.item);
}

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer);
});
</script>

<template>
  <div
    ref="reference"
    @mouseenter="openSubmenu"
    @mouseleave="scheduleCloseSubmenu"
  >
    <button
      type="button"
      class="flex w-full items-center gap-2 p-2 text-left leading-none transition-colors hover:text-primary-gray"
      :class="submenuOpen ? 'text-primary-gray' : 'text-primary-white'"
      @click="onSelect"
    >
      <component
        :is="props.item.icon"
        v-if="props.item.icon"
        class="shrink-0"
        :class="props.item.iconClass"
        :size="20"
        :weight="props.item.iconWeight ?? 'light'"
      />
      <span
        class="flex min-w-0 flex-1 items-center self-stretch whitespace-nowrap leading-normal"
        :class="props.item.labelClass"
      >
        {{ props.item.label }}
      </span>
      <PhCaretRight
        v-if="hasSubmenu"
        class="shrink-0"
        :size="20"
        weight="light"
      />
    </button>

    <!-- Flyout подменю -->
    <Teleport to="body">
      <div
        v-if="submenuOpen && hasSubmenu"
        ref="floating"
        data-menu-floating-panel
        :style="floatingStyles"
        :class="MENU_FLOATING_PANEL_CLASS"
        @mouseenter="openSubmenu"
        @mouseleave="scheduleCloseSubmenu"
      >
        <div class="flex flex-col">
          <MenuFloatingItem
            v-for="child in props.item.children"
            :key="child.id"
            :item="child"
            @select="emit('select', $event)"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
