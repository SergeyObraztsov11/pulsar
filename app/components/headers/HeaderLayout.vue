<script setup lang="ts">
/**
 * HeaderLayout — chrome шапки: прозрачный на чёрной подложке shell.
 */
</script>

<template>
  <header class="z-50 shrink-0 bg-transparent">
    <div class="mx-auto w-full px-2">
      <div class="flex h-16 w-full items-center">
        <slot />
      </div>
    </div>
  </header>
</template>
