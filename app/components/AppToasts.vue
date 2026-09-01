<script setup lang="ts">
/**
 * AppToasts — toast stack, bottom-right (desktop).
 * Newest on top; on dismiss older ones slide down (TransitionGroup move).
 */
import { storeToRefs } from "pinia";

const toastStore = useToastStore();
const { items } = storeToRefs(toastStore);
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <!-- Fixed anchor; inner stack — relative для leave absolute -->
      <div
        class="pointer-events-none fixed bottom-24 right-8 z-60 w-72 max-lg:hidden"
      >
        <TransitionGroup
          name="toast"
          tag="div"
          class="toast-stack relative flex flex-col gap-1"
          aria-live="polite"
          aria-label="Toast"
        >
          <div
            v-for="item in items"
            :key="item.id"
            class="toast-item pointer-events-auto flex items-center gap-3 rounded-xl bg-primary-gray-dark px-3 py-2 shadow-md"
          >
            <p
              class="min-w-0 flex-1 truncate text-sm font-medium leading-none text-primary-white"
            >
              {{ item.title }}
            </p>
            <UiButton
              variant="ghost"
              icon="X"
              aria-label="Закрыть"
              @click="toastStore.dismiss(item.id)"
            />
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Новый toast — чуть выше, опускается на место */
.toast-enter-from {
  opacity: 0;
  transform: translateY(-0.375rem);
}

/* Старый внизу — уезжает вниз; соседи съезжают через toast-move */
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.375rem);
}

.toast-leave-active {
  position: absolute;
  right: 0;
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: opacity 0.15s ease;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
