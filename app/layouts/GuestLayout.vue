<script setup lang="ts">
/**
 * GuestLayout — full-bleed; хедер всегда виден, при скролле — canvas.
 */
const scroller = ref<HTMLElement | null>(null);
const isScrolled = ref(false);

function onScroll() {
  const top = scroller.value?.scrollTop ?? 0;
  isScrolled.value = top > 24;
}
</script>

<template>
  <div class="relative h-dvh overflow-hidden bg-tone-shell text-tone-white">
    <!-- Хедер: прозрачный наверху, canvas после скролла -->
    <header
      class="absolute inset-x-0 top-0 z-50 transition-colors duration-300 ease-out motion-reduce:transition-none"
      :class="isScrolled ? 'bg-tone-canvas' : 'bg-transparent'"
    >
      <div
        class="mx-auto flex h-16 w-full max-w-7xl items-center justify-start gap-4 px-4 sm:px-8 lg:px-10"
      >
        <AppLogoMark class="mr-auto size-10" />
        <NuxtLink
          to="/login"
          class="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium leading-none text-tone-white transition-colors hover:text-tone-muted"
        >
          Войти
        </NuxtLink>
        <NuxtLink
          to="/register"
          class="inline-flex h-10 items-center rounded-full bg-tone-white px-4 text-sm font-medium leading-none text-tone-canvas transition-opacity hover:opacity-90"
        >
          Создать аккаунт
        </NuxtLink>
      </div>
    </header>

    <div
      ref="scroller"
      class="h-full overflow-x-hidden overflow-y-auto [scrollbar-color:var(--color-tone-muted)_transparent] [scrollbar-width:thin]"
      @scroll.passive="onScroll"
    >
      <main class="flex w-full flex-col">
        <slot />
      </main>
    </div>
  </div>
</template>
