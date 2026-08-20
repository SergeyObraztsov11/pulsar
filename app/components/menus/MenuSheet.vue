<script setup lang="ts">
/**
 * MenuSheet — мобильное меню снизу (Teleport + Transition).
 * Только items; children → drill-down + пункт «Назад».
 */
import { PhCaretLeft } from "@phosphor-icons/vue";
import {
  MENU_SHEET_BACK_ID,
  type MenuItem,
} from "./menu.types";
import { useMenuCloseOnHidden } from "./useMenuCloseOnHidden";

/** Открыто ли меню (v-model:open) */
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  /** Пункты меню */
  items: MenuItem[];
}>();

/** Якорь триггера (для закрытия при скрытии) */
const reference = ref<HTMLElement | null>(null);
/**
 * Видимость панели в Transition:
 * leave доигрывается, затем open=false.
 */
const panelShown = ref(false);
/** Стек уровней drill-down (каждый элемент — children выбранного пункта) */
const stack = ref<MenuItem[][]>([]);

/** Пункты текущего уровня (корень или вершины стека) */
const levelItems = computed(() => stack.value.at(-1) ?? props.items);
/** Есть ли вложенный уровень (показать «Назад») */
const inSubmenu = computed(() => stack.value.length > 0);
/** Служебный пункт «Назад» */
const backItem = computed<MenuItem>(() => ({
  id: MENU_SHEET_BACK_ID,
  label: "Back",
  icon: PhCaretLeft,
}));

useMenuCloseOnHidden(reference, open);

/**
 * Синхронизация open → panelShown.
 * immediate: при remount с open=true панель сразу должна появиться.
 */
watch(
  open,
  (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        requestAnimationFrame(() => {
          panelShown.value = true;
        });
      });
      return;
    }
    panelShown.value = false;
    stack.value = [];
  },
  { immediate: true },
);

/** Открыть / закрыть по клику на триггер */
function toggle() {
  open.value = !open.value;
}

/** Запустить leave-анимацию (open сбросится в onAfterLeave) */
function requestClose() {
  panelShown.value = false;
}

/** После leave: сбросить v-model open */
function onAfterLeave() {
  open.value = false;
}

/**
 * Выбор пункта: Назад / вход в children / лист (onClick + закрытие).
 */
function onSelect(item: MenuItem) {
  if (item.id === MENU_SHEET_BACK_ID) {
    stack.value = stack.value.slice(0, -1);
    return;
  }
  if (item.children?.length) {
    stack.value = [...stack.value, item.children];
    return;
  }
  item.onClick?.();
  requestClose();
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
    <Transition name="menu-sheet" @after-leave="onAfterLeave">
      <div
        v-if="panelShown"
        class="fixed inset-0 z-100 flex flex-col justify-end"
      >
        <!-- Затемнение -->
        <button
          type="button"
          class="menu-sheet-backdrop absolute inset-0 bg-primary-black/80"
          @click="requestClose"
        />

        <!-- Sheet -->
        <div
          class="menu-sheet-panel relative z-10 mt-16 flex max-h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden rounded-t-4xl bg-primary-gray-dark text-primary-white"
          @click.stop
        >
          <!-- Grabber -->
          <button
            type="button"
            class="flex h-6 w-full shrink-0 items-center justify-center"
            @click="requestClose"
          >
            <span
              class="h-1 w-10 rounded-full bg-primary-gray"
            />
          </button>

          <!-- Пункты -->
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div class="flex flex-col px-4 pb-4">
              <MenuSheetItem
                v-if="inSubmenu"
                :item="backItem"
                @select="onSelect"
              />
              <MenuSheetItem
                v-for="item in levelItems"
                :key="item.id"
                :item="item"
                @select="onSelect"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.menu-sheet-enter-active,
.menu-sheet-leave-active {
  transition: opacity 0.35s ease;
}

.menu-sheet-enter-active .menu-sheet-panel,
.menu-sheet-leave-active .menu-sheet-panel {
  transition: transform 0.35s ease;
}

.menu-sheet-enter-from,
.menu-sheet-leave-to {
  opacity: 0;
}

.menu-sheet-enter-to,
.menu-sheet-leave-from {
  opacity: 1;
}

.menu-sheet-enter-from .menu-sheet-panel,
.menu-sheet-leave-to .menu-sheet-panel {
  transform: translateY(100%);
}

.menu-sheet-enter-to .menu-sheet-panel,
.menu-sheet-leave-from .menu-sheet-panel {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .menu-sheet-enter-active,
  .menu-sheet-leave-active,
  .menu-sheet-enter-active .menu-sheet-panel,
  .menu-sheet-leave-active .menu-sheet-panel {
    transition: none;
  }
}
</style>
