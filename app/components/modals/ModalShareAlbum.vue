<script lang="ts">

export type ModalShareAlbumProps = {
  albumName?: string;
};
</script>

<script setup lang="ts">

const props = defineProps<ModalShareAlbumProps>();

const { close } = useModal();

function onClose() {
  close();
}
</script>

<template>
  <ModalLayout title="Модальное окно" @close="onClose">
    <div class="flex h-60 w-80">
      <p>Share album{{ props.albumName ? `: ${props.albumName}` : "" }}</p>
    </div>
  </ModalLayout>
</template>
