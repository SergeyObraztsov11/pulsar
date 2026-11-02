<script setup lang="ts">
/**
 * UploadCoverField — клик-зона обложки с objectURL-превью.
 */
import { PhImage } from "@phosphor-icons/vue";

const model = defineModel<File | null>({ default: null });

const inputEl = useTemplateRef<HTMLInputElement>("inputEl");
const previewUrl = ref<string | null>(null);

watch(
  model,
  (file) => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }
    if (file) {
      previewUrl.value = URL.createObjectURL(file);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

function openPicker() {
  inputEl.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  model.value = input.files?.[0] ?? null;
}
</script>

<template>
  <button
    type="button"
    class="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-tone-surface text-left transition-colors duration-200 hover:bg-tone-surface-hover motion-reduce:transition-none lg:max-w-none"
    aria-label="Добавить обложку"
    @click="openPicker"
  >
    <img
      v-if="previewUrl"
      :src="previewUrl"
      alt=""
      class="size-full object-cover"
    />
    <div
      v-else
      class="flex size-full flex-col items-center justify-center gap-3 p-6 text-tone-muted"
    >
      <PhImage :size="40" weight="light" />
      <span class="text-sm font-medium leading-none text-tone-white">
        Добавить обложку
      </span>
      <span class="text-xs leading-none">необязательно</span>
    </div>

    <input
      ref="inputEl"
      type="file"
      class="sr-only"
      accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
      @change="onFileChange"
    />
  </button>
</template>
