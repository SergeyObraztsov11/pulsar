<script lang="ts">

export type ModalAlbumReportProps = {
  albumName?: string;
};
</script>

<script setup lang="ts">

const props = defineProps<ModalAlbumReportProps>();

const { close } = useModal();

function onClose() {
  close();
}

</script>

<template>
  <ModalLayout title="Report" @close="onClose">
    <p>Report album{{ props.albumName ? `: ${props.albumName}` : "" }}</p>
  </ModalLayout>
</template>
