<script setup lang="ts">
/**
 * SearchField — pill-поиск для AppHeader + floating suggest.
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
import { MENU_FLOATING_PANEL_CLASS } from "~/components/menus/menu.types";

const route = useRoute();

const query = ref("");
const isFocused = ref(false);
const fieldEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");

const { tracks, albums, artists, trimmedQuery, hasResults, showEmpty } =
  useSearchSuggest(query);

/** Панель при фокусе и непустом запросе */
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
          width: `${Math.max(rects.reference.width, 288)}px`,
          maxHeight: `${Math.max(120, availableHeight - 8)}px`,
        });
      },
    }),
  ],
});

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
  <div class="relative min-w-0 shrink-0">
    <!-- Pill: tone-surface на shell -->
    <div
      ref="fieldEl"
      class="flex h-10 w-full min-w-0 items-center gap-2 rounded-full bg-tone-surface px-4 leading-none transition-colors focus-within:bg-tone-surface-hover"
    >
      <PhMagnifyingGlass
        :size="20"
        weight="light"
        class="shrink-0 text-tone-muted"
      />
      <input
        ref="inputEl"
        v-model="query"
        type="search"
        name="search"
        autocomplete="off"
        placeholder="Что хотите послушать?"
        class="h-full min-w-0 flex-1 bg-transparent text-sm leading-none text-tone-white outline-none placeholder:text-tone-muted"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown="onFieldKeydown"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelEl"
        data-menu-floating-panel
        :style="floatingStyles"
        :class="MENU_FLOATING_PANEL_CLASS"
        class="overflow-y-auto rounded-none"
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
