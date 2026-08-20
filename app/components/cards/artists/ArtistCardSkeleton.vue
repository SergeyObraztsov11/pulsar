<script setup lang="ts">
/**
 * ArtistCardSkeleton — pulse placeholder for ArtistCard.
 * Shares size via ArtistCardLayout (w-48, square avatar).
 */
</script>

<template>
  <ArtistCardLayout class="flex">
    <template #avatar>
      <div
        class="absolute inset-0 animate-pulse rounded-full bg-primary-gray-dark"
      />
    </template>
    <template #meta>
      <div class="h-4 w-2/3 animate-pulse rounded bg-primary-gray-dark" />
    </template>
  </ArtistCardLayout>
</template>
