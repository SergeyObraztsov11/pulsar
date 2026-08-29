<script setup lang="ts">
/**
 * HeaderLayout — sticky chrome: всегда gray-dark, как мини-плеер.
 */
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-primary-gray-dark bg-primary-gray-dark"
  >
    <div class="mx-auto w-full max-w-5xl px-8">
      <div class="flex h-16 w-full items-center">
        <slot />
      </div>
    </div>
  </header>
</template>
