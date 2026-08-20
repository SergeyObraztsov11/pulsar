<script setup lang="ts">
/**
 * UiSelectField — выбор из списка; панель как MenuFloating.
 */
import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { PhCaretDown } from "@phosphor-icons/vue";
import { MENU_FLOATING_PANEL_CLASS } from "~/components/menus/menu.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    options: { value: string; label: string }[];
    placeholder?: string;
  }>(),
  {
    placeholder: "",
  },
);

const model = defineModel<string>({ default: "" });
const open = ref(false);
const focused = ref(false);
const highlightedIndex = ref(0);
const triggerEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const optionIdPrefix = useId();

const selected = computed(
  () => props.options.find((item) => item.value === model.value) ?? null,
);

/** Плейсхолдер на рамке: фокус, открытый список или выбран пункт */
const isFloating = computed(
  () => open.value || focused.value || Boolean(selected.value),
);

const { floatingStyles } = useFloating(triggerEl, panelEl, {
  placement: "bottom-start",
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(8),
    flip(),
    shift({ padding: 8 }),
    size({
      apply({ rects, elements }) {
        Object.assign(elements.floating.style, {
          minWidth: `${rects.reference.width}px`,
        });
      },
    }),
  ],
});

onClickOutside(
  panelEl,
  () => {
    open.value = false;
  },
  { ignore: [triggerEl, "[data-menu-floating-panel]"] },
);

watch(open, async (isOpen) => {
  if (!isOpen) return;
  const selectedIndex = props.options.findIndex(
    (item) => item.value === model.value,
  );
  highlightedIndex.value = selectedIndex >= 0 ? selectedIndex : 0;
  await nextTick();
  document
    .getElementById(`${optionIdPrefix}-${highlightedIndex.value}`)
    ?.scrollIntoView({ block: "nearest" });
});

watch(highlightedIndex, async (index) => {
  if (!open.value) return;
  await nextTick();
  document
    .getElementById(`${optionIdPrefix}-${index}`)
    ?.scrollIntoView({ block: "nearest" });
});

/** Фокус на триггер; открываю список */
function focus() {
  triggerEl.value?.focus();
  open.value = true;
}

/** Открыть / закрыть */
function toggle() {
  open.value = !open.value;
}

/** Выбрать пункт и закрыть */
function selectOption(value: string) {
  model.value = value;
  open.value = false;
}

/** Клавиши: открытие, стрелки, Enter, Escape */
function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!open.value) {
      open.value = true;
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      const item = props.options[highlightedIndex.value];
      if (item) selectOption(item.value);
    }
    if (event.key === "ArrowDown") {
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        props.options.length - 1,
      );
    }
  }

  if (event.key === "ArrowUp" && open.value) {
    event.preventDefault();
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
  }

  if (event.key === "Escape") {
    open.value = false;
  }
}

defineExpose({ focus });
</script>

<template>
  <!-- Select: триггер как поле; список — панель меню -->
  <div class="relative min-w-0 w-full">
    <input type="hidden" v-bind="$attrs" :value="model" />

    <button
      ref="triggerEl"
      type="button"
      class="group flex h-10 w-full box-border items-center gap-3 rounded-full border bg-primary-gray-dark px-4 leading-none text-primary-white transition-colors"
      :class="isFloating ? 'border-primary-white' : 'border-transparent'"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="props.placeholder || undefined"
      @click="toggle"
      @keydown="onTriggerKeydown"
      @focus="focused = true"
      @blur="focused = false"
    >
      <span class="min-w-0 flex-1 truncate text-left leading-none text-primary-white">
        {{ selected?.label ?? "" }}
      </span>
      <PhCaretDown
        :size="20"
        weight="light"
        class="shrink-0 text-primary-gray transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <span
      v-if="props.placeholder"
      class="pointer-events-none absolute z-10 origin-left leading-none transition-all duration-200 motion-reduce:transition-none"
      :class="[
        isFloating
          ? 'top-0 left-4 -translate-y-1/2 px-1 text-xs'
          : 'top-1/2 left-4 -translate-y-1/2',
        isFloating ? 'text-primary-white' : 'text-primary-gray',
      ]"
    >
      <!-- Перекрывает рамку по центру подписи, текст поверх -->
      <span
        v-if="isFloating"
        aria-hidden="true"
        class="absolute top-1/2 right-0 left-0 h-[5px] -translate-y-1/2 bg-primary-black"
      />
      <span class="relative">{{ props.placeholder }}</span>
    </span>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        data-menu-floating-panel
        :style="floatingStyles"
        :class="MENU_FLOATING_PANEL_CLASS"
        role="listbox"
      >
        <div class="flex flex-col max-h-48 overflow-y-auto">
          <button
            v-for="(item, index) in props.options"
            :id="`${optionIdPrefix}-${index}`"
            :key="item.value"
            type="button"
            role="option"
            class="flex w-full items-center gap-2 p-2 text-left leading-none transition-colors hover:text-primary-gray"
            :class="
              index === highlightedIndex
                ? 'text-primary-gray'
                : 'text-primary-white'
            "
            :aria-selected="item.value === model"
            @click="selectOption(item.value)"
            @mouseenter="highlightedIndex = index"
          >
            <span
              class="flex min-w-0 flex-1 items-center self-stretch whitespace-nowrap leading-normal"
            >
              {{ item.label }}
            </span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
