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
    <div class="flex min-w-0 items-center gap-1">
      <NuxtLink
        v-if="isLgUp"
        :to="trackTo"
        class="min-w-0 truncate text-base font-medium text-primary-white hover:underline"
        @click.stop
      >
        {{ nameLabel }}
      </NuxtLink>
      <p
        v-else
        class="min-w-0 truncate text-base font-medium text-primary-white"
      >
        {{ nameLabel }}
      </p>
      <UiExplicitIcon />
    </div>
    <div v-if="isLgUp" class="truncate">
      <NuxtLink
        :to="artistTo"
        class="text-sm text-primary-gray hover:text-primary-white"
        @click.stop
      >
        {{ artistLabel }}
      </NuxtLink>
    </div>
    <p v-else class="truncate text-sm text-primary-gray">
      {{ artistLabel }}
    </p>
  </div>
</template>
