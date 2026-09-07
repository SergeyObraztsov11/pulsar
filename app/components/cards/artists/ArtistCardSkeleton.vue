<script setup lang="ts">
/**
 * ArtistCardSkeleton — pulse placeholder размера ArtistCard.
 */
</script>

<template>
  <div class="flex w-48 shrink-0 flex-col gap-2 rounded p-2">
    <div
      class="size-44 shrink-0 animate-pulse rounded-full bg-tone-surface-hover"
    />
    <div class="mx-auto h-4 w-2/3 animate-pulse rounded bg-tone-surface" />
  </div>
</template>
