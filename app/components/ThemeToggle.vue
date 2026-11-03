<script setup lang="ts">
/**
 * ThemeToggle — переключает явную светлую/тёмную тему.
 */
import { PhMoon, PhSun } from "@phosphor-icons/vue";

const { resolved, toggle } = useTheme();

const label = computed(() =>
  resolved.value === "light" ? "Тёмная тема" : "Светлая тема",
);
</script>

<template>
  <button
    type="button"
    class="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-tone-white transition-colors outline-none hover:bg-tone-surface-hover hover:text-tone-muted focus-visible:ring-2 focus-visible:ring-tone-white/50"
    :aria-label="label"
    :title="label"
    @click="toggle"
  >
    <PhMoon v-if="resolved === 'light'" :size="20" weight="light" />
    <PhSun v-else :size="20" weight="light" />
  </button>
</template>
