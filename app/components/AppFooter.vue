<script setup lang="ts">
/**
 * AppFooter — кратко о Pulsar, навигация и копирайт.
 */
</script>

<template>
  <footer
    class="border-t border-primary-gray-dark pt-8 pb-2 flex flex-col gap-2"
  >
    <!-- О проекте -->

    <p class="text-sm text-primary-gray lg:w-1/2">
      Pulsar — сервис для прослушивания и публикации музыки. Слушайте альбомы и
      треки, сохраняйте любимое и делитесь своим звуком.
    </p>

    <p class="text-sm text-primary-gray">
      © {{ new Date().getFullYear() }} Pulsar
    </p>
  </footer>
</template>
