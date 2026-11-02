<script setup lang="ts">
/**
 * SearchField — pill-поиск в AppLayout + floating suggest.
 * Выдача не завязана на blur инпута — иначе like/more закрывают панель.
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
import { PhMagnifyingGlass, PhX } from "@phosphor-icons/vue";
import { buildSearchSuggestItems, suggestItemTitle } from "~/utils/searchDictionary";
import type { SearchSuggestItem } from "~/utils/searchDictionary";

const route = useRoute();

const query = ref("");
const isFocused = ref(false);
/** Выдача открыта (не сбрасывается blur'ом инпута) */
const isSuggestOpen = ref(false);
const fieldEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");

const { tracks, albums, artists, trimmedQuery, hasResults, showEmpty } =
  useSearchSuggest(query);

/** Плоский список: запросы + сущности (как в панели) */
const suggestItems = computed(() =>
  buildSearchSuggestItems({
    query: trimmedQuery.value,
    tracks: tracks.value,
    albums: albums.value,
    artists: artists.value,
  }),
);

/** Активный пункт списка (−1 = нет выделения) */
const activeIndex = ref(-1);

watch(suggestItems, () => {
  activeIndex.value = -1;
});

watch(activeIndex, async (index) => {
  if (index < 0) return;
  await nextTick();
  panelEl.value
    ?.querySelector<HTMLElement>('[aria-current="true"]')
    ?.scrollIntoView({ block: "nearest" });
});

/** Есть что показать в панели */
const canShowSuggest = computed(
  () =>
    trimmedQuery.value.length > 0 &&
    (hasResults.value || showEmpty.value),
);

/** Панель: явный флаг + есть данные */
const isOpen = computed(
  () => isSuggestOpen.value && canShowSuggest.value,
);

/** Открыть выдачу при фокусе, если уже есть ответ */
watch([isFocused, canShowSuggest], ([focused, canShow]) => {
  if (focused && canShow) isSuggestOpen.value = true;
  if (!canShow) isSuggestOpen.value = false;
});

const { floatingStyles } = useFloating(fieldEl, panelEl, {
  placement: "bottom-start",
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(0),
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

function closeSuggest() {
  isSuggestOpen.value = false;
  isFocused.value = false;
  activeIndex.value = -1;
  inputEl.value?.blur();
}

onClickOutside(panelEl, closeSuggest, {
  ignore: [fieldEl, "[data-menu-floating-panel]"],
});

watch(
  () => route.fullPath,
  () => {
    closeSuggest();
  },
);

/** Синхрон поля с ?q= на /search (подсказка / Enter / внешний переход) */
watch(
  () => route.query.q,
  (qParam) => {
    if (route.path !== "/search") return;
    if (typeof qParam === "string") {
      query.value = qParam;
    }
  },
  { immediate: true },
);

function moveActive(delta: number) {
  const count = suggestItems.value.length;
  if (count === 0) return;

  const current = activeIndex.value;
  if (current < 0) {
    activeIndex.value = delta > 0 ? 0 : count - 1;
    return;
  }

  activeIndex.value = (current + delta + count) % count;
}

/** Подставить текст выбранной подсказки в поле */
function applySuggestToField(item: SearchSuggestItem) {
  query.value = suggestItemTitle(item);
}

/** Клик по строке suggest */
function onSuggestSelect(item: SearchSuggestItem) {
  applySuggestToField(item);
}

/** Перейти по пункту suggest или на /search с q */
function goSuggest(item: (typeof suggestItems.value)[number] | undefined) {
  if (item) applySuggestToField(item);
  closeSuggest();
  if (item) {
    void navigateTo(item.to);
    return;
  }
  void navigateTo({ path: "/search", query: { q: trimmedQuery.value } });
}

/** Enter — активный / первый suggest; иначе введённый q */
function onFieldKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    // Автоповтор при удержании — не листаем
    if (event.repeat) return;
    if (suggestItems.value.length === 0) return;
    event.preventDefault();
    moveActive(event.key === "ArrowDown" ? 1 : -1);
    return;
  }
  if (event.key === "Enter" && trimmedQuery.value) {
    event.preventDefault();
    const active = suggestItems.value[activeIndex.value];
    const first = suggestItems.value[0];
    goSuggest(active ?? first);
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeSuggest();
  }
}

function clearQuery() {
  query.value = "";
  activeIndex.value = -1;
  inputEl.value?.focus();
}

function onInputFocus() {
  isFocused.value = true;
  if (canShowSuggest.value) isSuggestOpen.value = true;
}
</script>

<template>
  <div class="relative min-w-0 shrink-0">
    <!-- Pill на shell; панель открыта — мягкий верх, низ без скругления -->
    <div
      ref="fieldEl"
      class="flex h-10 w-full min-w-0 items-center gap-2 bg-tone-surface px-4 leading-none transition-[colors] focus-within:bg-tone-surface-hover"
      :class="isOpen ? 'rounded-t-xl rounded-b-none' : 'rounded-full'"
    >
      <PhMagnifyingGlass
        :size="20"
        weight="regular"
        class="shrink-0 text-tone-muted"
      />
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        name="search"
        autocomplete="off"
        placeholder="Что хотите послушать?"
        class="h-full min-w-0 flex-1 bg-transparent text-sm leading-none text-tone-white outline-none placeholder:text-tone-muted"
        @focus="onInputFocus"
        @keydown="onFieldKeydown"
      />
      <button
        v-if="query"
        type="button"
        class="shrink-0 text-tone-muted transition-colors hover:text-tone-white"
        aria-label="Очистить поиск"
        @mousedown.prevent
        @click="clearQuery"
      >
        <PhX :size="20" weight="regular" />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelEl"
        data-search-suggest-panel
        :style="floatingStyles"
        class="z-100 overflow-y-auto border border-t-0 border-tone-surface-hover bg-tone-surface p-1 text-sm text-tone-white"
        @mousedown.prevent
      >
        <SearchSuggestPanel
          :query="trimmedQuery"
          :tracks="tracks"
          :albums="albums"
          :artists="artists"
          :show-empty="showEmpty"
          :has-results="hasResults"
          :active-index="activeIndex"
          @select="onSuggestSelect"
        />
      </div>
    </Teleport>
  </div>
</template>
