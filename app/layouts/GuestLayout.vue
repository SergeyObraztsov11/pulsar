<script setup lang="ts">
/**
 * GuestLayout — full-bleed; хедер всегда виден: сверху прозрачный,
 * после скролла — canvas с тонкой линией.
 */
const scroller = ref<HTMLElement | null>(null);
const isScrolled = ref(false);

function onScroll() {
  const top = scroller.value?.scrollTop ?? 0;
  isScrolled.value = top > 24;
}
</script>

<template>
  <div class="relative h-dvh overflow-hidden bg-tone-canvas text-tone-white">
    <!-- Хедер: прозрачный наверху, canvas + линия после скролла -->
    <header
      class="absolute inset-x-0 top-0 z-50 border-b transition-colors duration-300 ease-out motion-reduce:transition-none"
      :class="
        isScrolled
          ? 'border-tone-surface bg-tone-canvas'
          : 'border-transparent bg-transparent'
      "
    >
      <div
        class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 lg:px-10"
      >
        <AppLogo to="/" />

        <div class="flex shrink-0 items-center gap-2">
          <UiButton variant="ghost" text="Войти" @click="navigateTo('/login')" />
          <UiButton text="Создать аккаунт" @click="navigateTo('/register')" />
        </div>
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
