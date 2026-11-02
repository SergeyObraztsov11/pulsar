<script setup lang="ts">
/**
 * AppLogo — марк Pulsar + wordmark (без ссылки).
 */
const props = withDefaults(
  defineProps<{
    /** Header `lg` / compact `sm` */
    size?: "lg" | "sm";
  }>(),
  {
    size: "lg",
  },
);
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center gap-1 leading-none text-tone-white"
    aria-hidden="true"
  >
    <AppLogoMark :class="props.size === 'lg' ? 'size-10' : 'size-8'" />
    <span
      :class="props.size === 'lg' ? 'text-2xl' : 'text-xl'"
      class="font-bold"
    >
      Pulsar
    </span>
  </div>
</template>
