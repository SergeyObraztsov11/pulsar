<script setup lang="ts">
/**
 * TrackCardMeta — название и артист; desktop — ссылки, mobile — текст.
 */
defineProps<{
  nameLabel: string;
  artistLabel: string;
  trackTo: string;
  artistTo: string;
  isLgUp: boolean;
}>();
</script>

<template>
  <div class="min-w-0 flex-1">
    <div class="flex min-w-0 items-center">
      <NuxtLink
        v-if="isLgUp"
        :to="trackTo"
        class="min-w-0 truncate text-base font-medium text-tone-white transition-colors duration-200 hover:text-tone-muted"
        @click.stop
      >
        {{ nameLabel }}
      </NuxtLink>
      <p
        v-else
        class="min-w-0 truncate text-base font-medium text-tone-white"
      >
        {{ nameLabel }}
      </p>
    </div>
    <div v-if="isLgUp" class="truncate">
      <NuxtLink
        :to="artistTo"
        class="min-w-0 truncate text-base font-medium text-tone-white transition-colors duration-200 hover:text-tone-muted"
        @click.stop
      >
        {{ artistLabel }}
      </NuxtLink>
    </div>
    <p v-else class="truncate text-base font-medium text-tone-white">
      {{ artistLabel }}
    </p>
  </div>
</template>
