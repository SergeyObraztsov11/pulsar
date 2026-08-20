<script setup lang="ts">
const playerStore = usePlayerStore();

const showMiniPlayer = computed(
  () => playerStore.showPlayer && !playerStore.isExpanded,
);
</script>

<template>
  <!-- App layout — main: header + page; desktop-плеер внизу main; mobile: плеер + nav -->
  <div
    class="relative grid h-dvh overflow-hidden bg-primary-black text-primary-white grid-rows-[minmax(0,1fr)_auto_auto] lg:grid-rows-[minmax(0,1fr)]"
  >
    <main
      class="flex min-h-0 min-w-0 flex-col"
      :class="
        playerStore.showPlayer && playerStore.isExpanded
          ? 'invisible pointer-events-none'
          : null
      "
    >
      <!-- Скролл: хедер + контент — одна ширина с desktop-плеером -->
      <div
        class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-color:var(--color-primary-gray-dark)_transparent] [scrollbar-width:thin]"
      >
        <AuthHeader />

        <div class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-8 py-8">
          <slot />
          <AppFooter />
        </div>
      </div>

      <!-- Desktop мини-плеер: та же колонка, что хедер/контент -->
      <AppPlayerDesktop v-if="showMiniPlayer" />
    </main>

    <Transition name="player-mini">
      <AppPlayerMobile v-if="showMiniPlayer" />
    </Transition>

    <AppPlayerHost />

    <AppNavbarMobile />

    <AppPlayerExpandedDesktop />
  </div>
</template>

<style scoped>
.player-mini-enter-active,
.player-mini-leave-active {
  transition: transform 0.35s ease;
}

.player-mini-enter-from,
.player-mini-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .player-mini-enter-active,
  .player-mini-leave-active {
    transition: none;
  }
}
</style>
