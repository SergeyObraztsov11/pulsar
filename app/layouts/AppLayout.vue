<script setup lang="ts">
/**
 * AppLayout — shell: header (desktop), sidebar-слот, страница, player.
 */

const playerStore = usePlayerStore();

const hideShell = computed(
  () => playerStore.showPlayer && playerStore.isExpanded,
);

const SIDEBAR_WIDTH_DEFAULT = 360;
const SIDEBAR_WIDTH_MIN = 240;
const SIDEBAR_WIDTH_MAX = 420;

const sidebarWidth = ref(SIDEBAR_WIDTH_DEFAULT);
const isResizingSidebar = ref(false);

/** Ширина sidebar в допустимых пределах */
function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, width));
}

/** Drag за ручку между sidebar и main */
function onSidebarResizeStart(event: PointerEvent) {
  if (event.button !== 0) return;

  event.preventDefault();
  isResizingSidebar.value = true;

  const startX = event.clientX;
  const startWidth = sidebarWidth.value;

  function onMove(moveEvent: PointerEvent) {
    sidebarWidth.value = clampSidebarWidth(
      startWidth + (moveEvent.clientX - startX),
    );
  }

  function onEnd() {
    isResizingSidebar.value = false;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("pointercancel", onEnd);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onEnd);
  window.addEventListener("pointercancel", onEnd);
}
</script>

<template>
  <div
    class="relative flex h-dvh flex-col overflow-hidden bg-tone-shell text-tone-white"
    :class="isResizingSidebar ? 'select-none cursor-col-resize' : null"
  >
    <!-- Shell: скрываем при expanded, не размонтируем -->
    <div
      class="flex min-h-0 min-w-0 flex-1 flex-col"
      :class="hideShell ? 'invisible pointer-events-none' : null"
    >
      <AppHeader />

      <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden lg:px-2">
        <div class="hidden min-h-0 shrink-0 lg:flex">
          <aside
            class="min-h-0 shrink-0 self-stretch rounded-lg bg-tone-canvas"
            :style="{ width: `${sidebarWidth}px` }"
            aria-hidden="true"
          />

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Изменить ширину боковой панели"
            class="group flex w-2 shrink-0 cursor-col-resize touch-none items-stretch justify-center"
            @pointerdown="onSidebarResizeStart"
          >
            <div
              class="w-px rounded-full bg-transparent transition-colors duration-150 group-hover:bg-tone-muted motion-reduce:transition-none"
              :class="isResizingSidebar ? 'bg-tone-muted' : null"
            />
          </div>
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
