<script setup lang="ts">
/**
 * SearchField — компактный underline-поиск в шапке (у логотипа) + suggest.
 */
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { PhMagnifyingGlass } from "@phosphor-icons/vue";

const route = useRoute();

const query = ref("");
const isFocused = ref(false);
const fieldEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");

const { tracks, albums, artists, trimmedQuery, hasResults, showEmpty } =
  useSearchSuggest(query);

/** Панель видна при фокусе, непустом запросе и готовом ответе */
const isOpen = computed(
  () =>
    isFocused.value &&
    trimmedQuery.value.length > 0 &&
    (hasResults.value || showEmpty.value),
);

const searchPageTo = computed(() => ({
  path: "/search",
  query: { q: trimmedQuery.value },
}));

const { floatingStyles } = useFloating(fieldEl, panelEl, {
  placement: "bottom-start",
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(8),
    flip(),
    shift({ padding: 8 }),
    size({
      apply({ rects, elements, availableHeight }) {
        Object.assign(elements.floating.style, {
          /* Поле узкое — панель не уже 18rem */
          width: `${Math.max(rects.reference.width, 288)}px`,
          maxHeight: `${Math.max(120, availableHeight - 8)}px`,
        });
      },
    }),
  ],
});

/** Снять фокус с поля */
function blurField() {
  isFocused.value = false;
  inputEl.value?.blur();
}

onClickOutside(panelEl, blurField, { ignore: [fieldEl] });

watch(
  () => route.fullPath,
  () => {
    blurField();
  },
);

/** Enter — /search; Escape — закрыть */
function onFieldKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && trimmedQuery.value) {
    event.preventDefault();
    blurField();
    void navigateTo(searchPageTo.value);
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    blurField();
  }
}
</script>

<template>
  <div class="relative w-44 shrink-0 sm:w-52">
    <!-- Underline-строка: белый chrome -->
    <div
      ref="fieldEl"
      class="group box-border flex h-10 min-w-0 w-full items-center gap-2 border-b border-primary-white px-1 leading-none transition-opacity"
      :class="isFocused ? 'opacity-100' : 'opacity-80'"
    >
      <PhMagnifyingGlass
        :size="18"
        weight="light"
        class="shrink-0 text-primary-white"
      />
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        name="search"
        autocomplete="off"
        placeholder="Поиск…"
        class="h-full min-w-0 flex-1 bg-transparent text-left text-sm leading-none text-primary-white outline-none placeholder:text-primary-white/50"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown="onFieldKeydown"
      />
    </div>

    <!-- Подсказки поверх страницы -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelEl"
        data-menu-floating-panel
        :style="floatingStyles"
        class="z-60 overflow-y-auto rounded-xl border border-primary-gray-dark bg-primary-gray-dark p-1 text-sm text-primary-white"
        @mousedown.prevent
      >
        <SearchSuggestPanel
          :query="trimmedQuery"
          :tracks="tracks"
          :albums="albums"
          :artists="artists"
          :show-empty="showEmpty"
          :has-results="hasResults"
        />
      </div>
    </Teleport>
  </div>
</template>
