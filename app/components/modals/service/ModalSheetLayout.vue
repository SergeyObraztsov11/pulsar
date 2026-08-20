<script setup lang="ts">
/**
 * ModalSheetLayout — bottom sheet (выезд снизу, зазор сверху).
 * Grabber / backdrop → emit('close') после leave-анимации.
 */
const emit = defineEmits<{
  close: [];
}>();

/** false до mount → enter; false при закрытии → leave, затем emit close */
const show = ref(false);

onMounted(() => {
  // Next frame so Transition can run enter from translateY(100%)
  requestAnimationFrame(() => {
    show.value = true;
  });
});

function requestClose() {
  show.value = false;
}

function onAfterLeave() {
  emit("close");
}

defineExpose({ requestClose });
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-sheet" @after-leave="onAfterLeave">
      <div
        v-if="show"
        class="fixed inset-0 z-100 flex flex-col justify-end"
      >
        <!-- Backdrop -->
        <button
          type="button"
          class="modal-sheet-backdrop absolute inset-0 bg-primary-black/80"
          @click="requestClose"
        />

        <!-- Sheet panel -->
        <div
          class="modal-sheet-panel relative z-10 mt-16 flex max-h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden rounded-t-xl bg-primary-gray-dark text-primary-white"
        >
          <!-- Grabber — визуальный якорь sheet + закрытие -->
          <button
            type="button"
            class="flex w-full shrink-0 items-center justify-center pt-3 pb-2"
            @click="requestClose"
          >
            <span class="h-1 w-10 rounded-full bg-primary-gray" />
          </button>

          <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-sheet-enter-active,
.modal-sheet-leave-active {
  transition: opacity 0.35s ease;
}

.modal-sheet-enter-active .modal-sheet-panel,
.modal-sheet-leave-active .modal-sheet-panel {
  transition: transform 0.35s ease;
}

.modal-sheet-enter-from,
.modal-sheet-leave-to {
  opacity: 0;
}

.modal-sheet-enter-to,
.modal-sheet-leave-from {
  opacity: 1;
}

.modal-sheet-enter-from .modal-sheet-panel,
.modal-sheet-leave-to .modal-sheet-panel {
  transform: translateY(100%);
}

.modal-sheet-enter-to .modal-sheet-panel,
.modal-sheet-leave-from .modal-sheet-panel {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .modal-sheet-enter-active,
  .modal-sheet-leave-active,
  .modal-sheet-enter-active .modal-sheet-panel,
  .modal-sheet-leave-active .modal-sheet-panel {
    transition: none;
  }
}
</style>
