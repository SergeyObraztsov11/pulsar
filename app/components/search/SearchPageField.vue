<script setup lang="ts">
/**
 * SearchPageField — крупное поле ввода (без навигации; submit наружу).
 */
import { PhMagnifyingGlass } from "@phosphor-icons/vue";

const model = defineModel<string>({ default: "" });

const emit = defineEmits<{
  submit: [query: string];
}>();

const isFocused = ref(false);
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
</script>

<template>
  <div class="relative min-w-0 w-full">
    <!-- Крупное поле страницы -->
    <div
      class="group box-border flex h-14 min-w-0 w-full items-center gap-4 rounded-full border bg-primary-gray-dark px-5 leading-none transition-colors"
      :class="isFocused ? 'border-primary-gray' : 'border-transparent'"
    >
      <input
        ref="inputEl"
        v-model="model"
        type="text"
        name="search"
        autocomplete="off"
        placeholder="Поиск по артистам, альбомам, трекам"
        class="h-full min-w-0 flex-1 bg-transparent text-lg leading-none text-primary-white outline-none placeholder:text-primary-gray"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown="onFieldKeydown"
      />
      <div class="shrink-0 text-primary-white transition-colors">
        <PhMagnifyingGlass :size="28" weight="light" />
      </div>
    </div>
  </div>
</template>
