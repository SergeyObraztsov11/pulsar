<script setup lang="ts">
/**
 * SearchResultRow — текстовая строка подсказки.
 */
const props = defineProps<{
  to: string;
  title: string;
}>();
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="block truncate px-3 py-2 text-sm leading-none text-primary-white transition-colors hover:text-primary-gray"
  >
    {{ props.title }}
  </NuxtLink>
</template>
