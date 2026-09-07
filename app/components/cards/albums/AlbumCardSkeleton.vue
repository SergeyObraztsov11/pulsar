<script setup lang="ts">
/**
 * AlbumCardSkeleton — pulse placeholder размера AlbumCard.
 */
</script>

<template>
  <div class="flex w-48 shrink-0 flex-col gap-2 rounded p-2">
    <div
      class="size-44 shrink-0 animate-pulse rounded bg-tone-surface-hover"
    />
    <div class="flex flex-col gap-2">
      <div class="h-4 w-3/4 animate-pulse rounded bg-tone-surface" />
      <div class="h-3 w-1/2 animate-pulse rounded bg-tone-surface" />
    </div>
  </div>
</template>
