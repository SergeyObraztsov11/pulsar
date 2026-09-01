<script setup lang="ts">
/**
 * AppLayout — shell авторизованного приложения.
 *
 * Плеер: каждый chrome-компонент сам решает, когда рендериться (mini / expanded).
 * Desktop mini — внутри main, чтобы совпасть по ширине с header и контентом (max-w-5xl).
 */
const playerStore = usePlayerStore();

/** Expanded перекрывает main — скрываем контент, но не размонтируем */
const hideMainForExpanded = computed(
  () => playerStore.showPlayer && playerStore.isExpanded,
);
</script>

<template>
  <div
    class="relative flex h-dvh flex-col overflow-hidden bg-primary-black text-primary-white"
  >
    <!-- Main: header + страница; desktop mini player — в той же колонке -->
    <main
      class="flex min-h-0 min-w-0 flex-1 flex-col"
      :class="hideMainForExpanded ? 'invisible pointer-events-none' : null"
    >
      <div
        class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-color:var(--color-primary-gray-dark)_transparent] [scrollbar-width:thin]"
      >
        <AuthHeader />

        <div class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-8 pt-4 pb-8">
          <slot />
          <AppFooter />
        </div>
      </div>

      <AppPlayerDesktop />
    </main>

    <!-- Mobile: mini player + bottom nav -->
    <div class="shrink-0 lg:hidden">
      <AppPlayerMobile />
      <AppNavbarMobile />
    </div>

    <!-- Player overlays (v-if внутри компонентов) -->
    <AppPlayerExpandedDesktop />
    <AppPlayerExpandedMobile />

    <!-- Services -->
    <AppAudioHost />
  </div>
</template>
