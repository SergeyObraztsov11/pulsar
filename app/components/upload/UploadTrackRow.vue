<script setup lang="ts">
/**
 * UploadTrackRow — строка черновика трека: имя, MP3, Explicit, удалить.
 */
import { PhTrash } from "@phosphor-icons/vue";

export type UploadTrackDraft = {
  name: string;
  audio: File | null;
  isExplicit: boolean;
};

const props = defineProps<{
  track: UploadTrackDraft;
  index: number;
  /** Можно ли удалить (треков > 1) */
  canRemove?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  remove: [];
}>();

const audioInputEl = useTemplateRef<HTMLInputElement>("audioInputEl");

const audioLabel = computed(() =>
  props.track.audio ? props.track.audio.name : "Выбрать файл",
);

function openAudioPicker() {
  if (props.disabled) return;
  audioInputEl.value?.click();
}

function onAudioChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  props.track.audio = file;
  if (file && !props.track.name.trim()) {
    props.track.name = file.name.replace(/\.[^.]+$/, "");
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-lg bg-tone-surface p-3 sm:flex-row sm:items-center sm:gap-4"
  >
    <span
      class="w-6 shrink-0 text-sm tabular-nums text-tone-muted sm:text-center"
    >
      {{ index + 1 }}
    </span>

    <div class="min-w-0 flex-1">
      <UiTextField
        v-model.trim="track.name"
        placeholder="Название трека"
      />
    </div>

    <div class="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">
      <button
        type="button"
        class="inline-flex h-10 max-w-48 items-center truncate rounded-full bg-tone-surface-hover px-4 text-sm font-medium leading-none text-tone-white transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        :disabled="disabled"
        @click="openAudioPicker"
      >
        <span class="truncate">{{ audioLabel }}</span>
      </button>
      <input
        ref="audioInputEl"
        type="file"
        class="sr-only"
        accept="audio/mpeg,.mp3"
        @change="onAudioChange"
      />

      <label class="flex items-center gap-2 text-sm text-tone-muted">
        <UiToggle
          v-model="track.isExplicit"
          :disabled="disabled"
          aria-label="Explicit"
        />
        <span class="leading-none">E</span>
      </label>

      <button
        v-if="canRemove"
        type="button"
        class="flex size-10 shrink-0 items-center justify-center text-tone-muted transition-colors hover:text-tone-white disabled:pointer-events-none disabled:opacity-40"
        :disabled="disabled"
        aria-label="Убрать трек"
        @click="emit('remove')"
      >
        <PhTrash :size="20" weight="light" />
      </button>
    </div>
  </div>
</template>
