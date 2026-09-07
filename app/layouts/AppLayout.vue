<script setup lang="ts">
/**
 * AppLayout — shell: header (desktop), sidebar, страница, player.
 */

const playerStore = usePlayerStore();

const hideShell = computed(
  () => playerStore.showPlayer && playerStore.isExpanded,
);
</script>

<template>
  <div
    class="relative flex h-dvh flex-col overflow-hidden bg-tone-shell text-tone-white"
  >
    <!-- Shell: скрываем при expanded, не размонтируем -->
    <div
      class="flex min-h-0 min-w-0 flex-1 flex-col"
      :class="hideShell ? 'invisible pointer-events-none' : null"
    >
      <AppHeader />

      <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden lg:px-2">
        <div class="hidden min-h-0 shrink-0 self-stretch lg:flex">
          <AppLibrarySidebar />
        </div>

        <main
          class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-tone-canvas [scrollbar-color:var(--color-tone-muted)_transparent] [scrollbar-width:thin] lg:rounded-lg"
        >
          <slot />
          <AppFooter class="px-4 pb-4 lg:px-6 lg:pb-6" />
        </main>
      </div>

      <AppPlayerDesktop />

      <div class="shrink-0 lg:hidden">
        <AppPlayerMobile />
        <AppNavbarMobile />
      </div>
    </div>

    <AppPlayerExpandedDesktop />
    <AppPlayerExpandedMobile />
    <AppAudioHost />
  </div>
</template>
