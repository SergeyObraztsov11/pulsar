<script setup lang="ts">
/**
 * PlaylistCardLayout — fixed playlist card size (w-48, cover size-48).
 * Display (`flex` / `hidden lg:flex`) comes via attrs.
 */
defineOptions({ inheritAttrs: false });
</script>

<template>
  <div class="w-48 shrink-0 flex-col gap-2" v-bind="$attrs">
    <!-- Cover: fixed 192×192 -->
    <div
      class="relative size-48 shrink-0 overflow-hidden rounded-xl bg-primary-gray-dark"
    >
      <slot name="cover" />
    </div>

    <!-- Meta -->
    <div class="flex min-w-0 flex-col">
      <slot name="meta" />
    </div>
  </div>
</template>
