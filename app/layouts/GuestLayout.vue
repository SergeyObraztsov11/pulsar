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
    <header
      class="absolute inset-x-0 top-0 z-50 border-b bg-tone-canvas transition-colors duration-300 ease-out motion-reduce:transition-none"
      :class="isScrolled ? 'border-tone-surface' : 'border-transparent'"
    >
      <!-- На mobile: марк без wordmark и короткая подпись CTA -->
      <div
        class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4 sm:px-8 lg:px-10"
      >
        <NuxtLink
          to="/"
          class="inline-flex shrink-0 items-center gap-1 leading-none text-tone-white transition-colors hover:text-tone-muted"
          aria-label="Pulsar"
        >
          <AppLogoMark class="size-9 sm:size-10" />
          <span class="hidden text-2xl font-bold sm:inline">Pulsar</span>
        </NuxtLink>

        <div class="flex shrink-0 items-center gap-1 sm:gap-2">
          <UiButton
            variant="ghost"
            text="Войти"
            @click="navigateTo('/login')"
          />

          <UiButton variant="white" text="Создать аккаунт" @click="navigateTo('/register')" />
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
