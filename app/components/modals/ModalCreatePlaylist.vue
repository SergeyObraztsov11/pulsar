<script lang="ts">
import type { PlaylistSummary } from "~/types/playlist";

export type ModalCreatePlaylistProps = {
  trackId?: string;
  onCreated?: (playlist: PlaylistSummary) => void;
};
</script>

<script setup lang="ts">
/**
 * ModalCreatePlaylist — создать плейлист; опционально добавить текущий трек.
 */
const props = defineProps<ModalCreatePlaylistProps>();

const { close } = useModal();
const { createPlaylist, addTrackToPlaylist } = useUserPlaylists(
  () => props.trackId,
);

const name = ref("");
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const trimmed = computed(() => name.value.trim());
const canSave = computed(
  () =>
    trimmed.value.length > 0 && trimmed.value.length <= 120 && !saving.value,
);

function onClose() {
  close();
}

async function onSave() {
  if (!canSave.value) return;
  errorMessage.value = null;
  saving.value = true;

  try {
    const playlist = await createPlaylist(trimmed.value);
    if (props.trackId) {
      await addTrackToPlaylist(playlist.id, props.trackId);
    }
    props.onCreated?.(playlist);
    close();
  } catch {
    errorMessage.value = "Не удалось создать плейлист";
    saving.value = false;
  }
}
</script>

<template>
  <ModalLayout title="Новый плейлист" @close="onClose">
    <form
      class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4"
      @submit.prevent="onSave"
    >
      <p class="text-sm text-tone-muted">
        Название можно изменить позже в настройках плейлиста.
      </p>

      <UiTextField
        v-model="name"
        placeholder="Название"
        autocomplete="off"
        maxlength="120"
      />

      <p v-if="errorMessage" class="text-sm text-danger">
        {{ errorMessage }}
      </p>

      <div class="flex justify-end gap-2">
        <UiButton
          type="submit"
          :variant="saving ? 'loading' : 'white'"
          text="Создать"
          :disabled="!canSave"
        />
      </div>
    </form>
  </ModalLayout>
</template>
