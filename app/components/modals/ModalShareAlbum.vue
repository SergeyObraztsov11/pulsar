<script lang="ts">
export type ModalShareAlbumProps = {
  albumName?: string;
};
</script>

<script setup lang="ts">
/**
 * Заглушка шаринга альбома.
 */
const props = defineProps<ModalShareAlbumProps>();

const { close } = useModal();

function onClose() {
  close();
}
</script>

<template>
  <ModalLayout title="Поделиться" @close="onClose">
    <div class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4">
      <p class="text-sm text-tone-muted">
        Ссылка на альбом
        <span v-if="props.albumName" class="text-tone-white">
          «{{ props.albumName }}»</span
        >
        скоро появится здесь.
      </p>

      <div class="flex justify-end gap-2">
        <UiButton
          type="button"
          variant="white"
          text="Понятно"
          @click="onClose"
        />
      </div>
    </div>
  </ModalLayout>
</template>
