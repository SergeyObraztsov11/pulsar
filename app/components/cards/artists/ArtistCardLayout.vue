<script setup lang="ts">
/**
 * ArtistCardLayout — fixed artist card size (w-48, square avatar).
 * Used by ArtistCard and ArtistCardSkeleton.
 * Display (`flex` / `hidden lg:flex`) comes via attrs — like TrackCardLayout.
 */
defineOptions({ inheritAttrs: false });
</script>

<template>
  <div
    class="w-48 shrink-0 flex-col gap-2"
    v-bind="$attrs"
  >
    <!-- Avatar -->
    <div class="relative aspect-square w-full">
      <slot name="avatar" />
    </div>

    <!-- Meta -->
    <div class="flex min-w-0 flex-col items-center text-center">
      <slot name="meta" />
    </div>
  </div>
</template>
