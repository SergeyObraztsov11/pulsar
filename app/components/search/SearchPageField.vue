<script setup lang="ts">
/**
 * SearchPageField — поле страницы /search (submit / clear наружу).
 */
import { PhMagnifyingGlass, PhX } from "@phosphor-icons/vue";

const model = defineModel<string>({ default: "" });

const emit = defineEmits<{
  submit: [query: string];
  clear: [];
}>();

const inputEl = useTemplateRef<HTMLInputElement>("inputEl");

const trimmedQuery = computed(() => model.value.trim());

/** Enter — submit; Escape — снять фокус */
function onFieldKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && trimmedQuery.value) {
    event.preventDefault();
    inputEl.value?.blur();
    emit("submit", trimmedQuery.value);
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    inputEl.value?.blur();
  }
}

function clearQuery() {
  model.value = "";
  emit("clear");
  inputEl.value?.focus();
}
</script>

<template>
  <div class="relative min-w-0 w-full">
    <!-- Pill: как SearchField, чуть выше -->
    <div
      class="flex h-12 w-full min-w-0 items-center gap-2 rounded-full bg-tone-surface px-4 leading-none transition-colors focus-within:bg-tone-surface-hover"
    >
      <PhMagnifyingGlass
        :size="20"
        weight="light"
        class="shrink-0 text-tone-muted"
      />
      <input
        ref="inputEl"
        v-model="model"
        type="text"
        name="search"
        autocomplete="off"
        placeholder="Поиск по артистам, альбомам, трекам"
        class="h-full min-w-0 flex-1 bg-transparent text-base leading-none text-tone-white outline-none placeholder:text-tone-muted"
        @keydown="onFieldKeydown"
      />
      <button
        v-if="model"
        type="button"
        class="shrink-0 text-tone-muted transition-colors hover:text-tone-white"
        aria-label="Очистить поиск"
        @mousedown.prevent
        @click="clearQuery"
      >
        <PhX :size="16" weight="light" />
      </button>
    </div>
  </div>
</template>
