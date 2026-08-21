<script setup lang="ts">
/**
 * HeaderLayout — sticky chrome frame: solid on scroll.
 * Concrete headers fill the default slot.
 */
</script>

<template>
  <header ref="headerEl" class="sticky top-0 z-50 backdrop-blur-sm">
    <!-- Header band -->
    <div class="mx-auto w-full max-w-5xl px-8">
      <div class="flex h-16 w-full items-center">
        <slot />
      </div>
    </div>
  </header>
</template>
