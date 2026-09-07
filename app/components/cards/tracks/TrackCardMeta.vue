<script setup lang="ts">
/**
 * TrackCardMeta — название и артист ссылками.
 * На mobile — pointer-events-none (клик ловит строка); один DOM для SSR/клиента.
 */
withDefaults(
  defineProps<{
    nameLabel?: string;
    artistLabel?: string;
    trackTo?: string;
    artistTo?: string;
  }>(),
  {
    nameLabel: "",
    artistLabel: "",
    trackTo: "/",
    artistTo: "/",
  },
);
</script>

<template>
  <div class="min-w-0 flex-1">
    <div class="flex min-w-0 items-center">
      <NuxtLink
        :to="trackTo"
        class="min-w-0 truncate text-base font-medium text-tone-white transition-colors duration-200 hover:text-tone-muted max-lg:pointer-events-none"
        @click.stop
      >
        {{ nameLabel }}
      </NuxtLink>
    </div>
    <div class="truncate">
      <NuxtLink
        :to="artistTo"
        class="min-w-0 truncate text-base font-medium text-tone-white transition-colors duration-200 hover:text-tone-muted max-lg:pointer-events-none"
        @click.stop
      >
        {{ artistLabel }}
      </NuxtLink>
    </div>
  </div>
</template>
