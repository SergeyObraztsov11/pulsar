<script setup lang="ts">
/**
 * AppPlayerExpandedMobile — полноэкранный expanded-плеер (< lg).
 * Пока пустая оболочка; контент — позже.
 */
const playerStore = usePlayerStore();
</script>

<template>
  <Transition name="player-expand-mobile">
    <div
      v-if="playerStore.showPlayer && playerStore.isExpanded"
      class="absolute inset-0 z-50 flex flex-col overflow-hidden bg-primary-black lg:hidden"
    >
      <!-- Chrome: свернуть -->
      <div class="flex shrink-0 items-center justify-end px-4 pt-4">
        <UiButton
          class="scale-125"
          variant="gray"
          icon="CaretDown"
          aria-label="Свернуть"
          @click="playerStore.closeExpanded()"
        />
      </div>

      <!-- Контент expanded — позже -->
      <div class="min-h-0 flex-1" />
    </div>
  </Transition>
</template>

<style scoped>
.player-expand-mobile-enter-active,
.player-expand-mobile-leave-active {
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}

.player-expand-mobile-enter-from,
.player-expand-mobile-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .player-expand-mobile-enter-active,
  .player-expand-mobile-leave-active {
    transition: none;
  }
}
</style>
