<script setup lang="ts">
/**
 * SearchField — поиск в шапке: поле + панель подсказок (Teleport + Floating UI).
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

const {
  tracks,
  albums,
  artists,
  trimmedQuery,
  hasResults,
  showEmpty,
} = useSearchSuggest(query);

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
  placement: "bottom",
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(8),
    flip(),
    shift({ padding: 8 }),
    size({
      apply({ rects, elements, availableHeight }) {
        Object.assign(elements.floating.style, {
          width: `${rects.reference.width}px`,
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
  <div class="relative min-w-0 w-full">
    <!-- Поле -->
    <div
      ref="fieldEl"
      class="group box-border flex h-10 min-w-0 w-full items-center gap-3 rounded-full border bg-primary-gray-dark px-4 leading-none transition-colors"
      :class="isFocused ? 'border-primary-white' : 'border-transparent'"
    >
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        name="search"
        autocomplete="off"
        placeholder="Поиск по артистам, альбомам, трекам"
        class="h-full min-w-0 flex-1 bg-transparent text-center text-base leading-none text-primary-white outline-none placeholder:text-primary-gray"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown="onFieldKeydown"
      />
      <div
        class="shrink-0 text-primary-gray transition-colors group-focus-within:text-primary-white"
      >
        <PhMagnifyingGlass :size="20" weight="light" />
      </div>
    </div>

    <!-- Подсказки поверх страницы -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelEl"
        data-menu-floating-panel
        :style="floatingStyles"
        class="z-60 overflow-y-auto rounded-xl border border-primary-gray-dark bg-primary-black p-1 text-sm text-primary-white backdrop-blur-sm"
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
