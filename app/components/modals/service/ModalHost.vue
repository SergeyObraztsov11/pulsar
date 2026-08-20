<script setup lang="ts">
/**
 * ModalHost — один на приложение (app.vue).
 * Рендерит активную модалку; layout и закрытие — внутри неё.
 */
const modalStore = useModalStore();
</script>

<template>
  <component
    :is="modalStore.component"
    v-if="modalStore.isOpen && modalStore.component"
    v-bind="modalStore.props"
  />
</template>
