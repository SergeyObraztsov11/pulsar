<script setup lang="ts">
/**
 * TrackCardSkeleton — pulse placeholder for track row.
 * Shares size via TrackCardLayout (h-16). One shape for cover/number.
 */
</script>

<template>
  <TrackCardLayout class="flex items-center">
    <div
      class="size-12 shrink-0 animate-pulse rounded-md bg-primary-gray-dark"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div
        class="h-4 w-2/5 max-w-48 animate-pulse rounded bg-primary-gray-dark"
      />
      <div
        class="h-3 w-1/4 max-w-32 animate-pulse rounded bg-primary-gray-dark"
      />
    </div>
    <div class="size-8 shrink-0 animate-pulse rounded bg-primary-gray-dark" />
  </TrackCardLayout>
</template>
