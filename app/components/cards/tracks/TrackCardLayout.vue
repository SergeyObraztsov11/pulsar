<script setup lang="ts">
/**
 * TrackCardLayout — fixed track row size (h-16, full width).
 * Used by TrackCover / Index / Ranked cards and TrackCardSkeleton.
 * Visibility / hover / current styles come via attrs (class, listeners).
 */
defineOptions({ inheritAttrs: false });
</script>

<template>
  <div
    class="h-16 w-full items-center gap-2 rounded-xl bg-primary-black p-2"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
