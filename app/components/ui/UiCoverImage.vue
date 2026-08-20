<script setup lang="ts">
/**
 * UiCoverImage — stretches to fill parent (`size-full`).
 * src: ключ бакета (`covers/albums/…`) или готовый URL / путь из public.
 */
import type { Component } from "vue";
import { PhDisc } from "@phosphor-icons/vue";
import { toMediaSrc } from "~/utils/mediaSrc";

const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    /** Fallback icon (Phosphor). Default: PhDisc */
    icon?: Component;
    /** Icon size as % of the parent block (1–100). Default: 40 */
    iconSize?: number;
  }>(),
  {
    alt: "",
    icon: PhDisc,
    iconSize: 40,
  },
);

const mediaSrc = computed(() => toMediaSrc(props.src));

const failed = ref(false);

watch(mediaSrc, () => {
  failed.value = false;
});

const showImage = computed(() => Boolean(mediaSrc.value) && !failed.value);

const iconBoxStyle = computed(() => ({
  width: `${props.iconSize}%`,
  height: `${props.iconSize}%`,
}));
</script>

<template>
  <img
    v-if="showImage"
    :src="mediaSrc!"
    :alt="props.alt"
    class="size-full object-cover"
    @error="failed = true"
  />
  <div v-else class="flex size-full items-center justify-center">
    <div class="text-primary-white" :style="iconBoxStyle">
      <component
        :is="props.icon"
        class="!size-full"
        weight="light"
      />
    </div>
  </div>
</template>
