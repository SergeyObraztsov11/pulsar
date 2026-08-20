<template>
  <NuxtLayout>
    <NuxtPage
      :transition="{
        name: 'page',
        mode: 'out-in',
      }"
    />
  </NuxtLayout>
  <!-- Глобальная модалка (открывается через useModal) -->
  <ModalHost />
</template>
