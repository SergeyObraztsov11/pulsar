<script setup lang="ts">
/**
 * AppLogo — марк Pulsar + wordmark, ссылка на главную.
 */
const props = withDefaults(
  defineProps<{
    to?: string;
    /** Header `lg` / compact `sm` */
    size?: "lg" | "sm";
  }>(),
  {
    to: "/",
    size: "lg",
  },
);
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="inline-flex shrink-0 items-center gap-1 leading-none text-primary-white transition-colors hover:text-primary-gray"
    aria-label="Pulsar"
  >
    <AppLogoMark :class="props.size === 'lg' ? 'size-10' : 'size-8'" />
    <span
      :class="props.size === 'lg' ? 'text-2xl' : 'text-xl'"
      class="font-bold"
    >
      Pulsar
    </span>
  </NuxtLink>
</template>
