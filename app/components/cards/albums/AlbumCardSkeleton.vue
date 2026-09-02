<script setup lang="ts">
/**
 * AlbumCardSkeleton — pulse placeholder for AlbumCard.
 * Shares size via AlbumCardLayout (cover size-48).
 */
</script>

<template>
  <AlbumCardLayout class="flex">
    <template #cover>
      <div class="size-full animate-pulse bg-tone-surface" />
    </template>
    <template #meta>
      <div class="flex flex-col gap-2">
        <div class="h-4 w-3/4 animate-pulse rounded bg-tone-surface" />
        <div class="h-3 w-1/2 animate-pulse rounded bg-tone-surface" />
      </div>
    </template>
  </AlbumCardLayout>
</template>
