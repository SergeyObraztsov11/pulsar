<script setup lang="ts">
/**
 * SearchResultRow — словарная подсказка → /search?q= (с подсветкой query).
 */
import type { RouteLocationRaw } from "vue-router";
import { PhMagnifyingGlass } from "@phosphor-icons/vue";
import { splitQueryHighlight } from "~/utils/searchDictionary";

const props = defineProps<{
  to: RouteLocationRaw;
  title: string;
  /** Текущий ввод — для bold совпадения */
  query?: string;
  /** Подсветка с клавиатуры */
  active?: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();

const parts = computed(() =>
  splitQueryHighlight(props.title, props.query ?? ""),
);
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="group flex min-w-0 w-full flex-row items-center gap-3 p-2 text-tone-white transition-colors hover:bg-tone-surface-hover"
    :class="props.active ? 'bg-tone-surface-hover' : null"
    :aria-current="props.active ? 'true' : undefined"
    @click="emit('select')"
  >
    <PhMagnifyingGlass class="size-5 shrink-0 text-tone-muted" weight="light" />
    <span class="min-w-0 flex-1 truncate text-base leading-none">
      <span v-if="parts.match">
        <span>{{ parts.before }}</span>
        <span class="font-bold">{{ parts.match }}</span>
        <span>{{ parts.after }}</span>
      </span>
      <span v-else>{{ props.title }}</span>
    </span>
  </NuxtLink>
</template>
