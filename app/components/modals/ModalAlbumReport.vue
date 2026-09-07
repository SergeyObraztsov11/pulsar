<script lang="ts">
export type ModalAlbumReportProps = {
  albumName?: string;
};
</script>

<script setup lang="ts">
/**
 * Заглушка жалобы на альбом.
 */
const props = defineProps<ModalAlbumReportProps>();

const { close } = useModal();

function onClose() {
  close();
}
</script>

<template>
  <ModalLayout title="Пожаловаться" @close="onClose">
    <div class="flex w-[min(100vw-4rem,22rem)] flex-col gap-4">
      <p class="text-sm text-tone-muted">
        Расскажите, что не так с альбомом
        <span v-if="props.albumName" class="text-tone-white">
          «{{ props.albumName }}»</span
        >. Жалобы скоро заработают.
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
