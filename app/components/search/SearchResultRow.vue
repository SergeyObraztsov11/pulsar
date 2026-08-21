<script setup lang="ts">
/**
 * SearchResultRow — текстовая строка подсказки.
 */
import { PhMagnifyingGlass } from "@phosphor-icons/vue";
const props = defineProps<{
  to: string;
  title: string;
}>();
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="group flex min-w-0 w-full flex-row items-center gap-2 rounded-lg p-2 text-primary-white transition-colors hover:bg-primary-gray/25"
  >
    <PhMagnifyingGlass class="size-4" weight="light" />
    <span class="truncate">{{ props.title }}</span>
  </NuxtLink>
</template>
