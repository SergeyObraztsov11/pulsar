<script setup lang="ts">
/**
 * ModalLayout — оболочка модалки (затемнение, title, крестик).
 *
 * Открытие/закрытие — fade opacity, как у expanded player.
 * Крестик / клик снаружи → leave, затем emit('close').
 * Контент слушает @close и вызывает useModal().close().
 */
import { onClickOutside } from "@vueuse/core";

const props = defineProps<{
  /** Заголовок в шапке (если есть) */
  title?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const panel = ref<HTMLElement | null>(null);

/** false до mount → enter; false при закрытии → leave, затем emit */
const show = ref(false);

onMounted(() => {
  requestAnimationFrame(() => {
    show.value = true;
  });
});

function requestClose() {
  if (!show.value) return;
  show.value = false;
}

function onAfterLeave() {
  emit("close");
}

onClickOutside(panel, () => {
  requestClose();
});

defineExpose({ requestClose });
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade" @after-leave="onAfterLeave">
      <!-- Затемнение -->
      <div
        v-if="show"
        class="fixed inset-0 z-100 flex items-center justify-center bg-primary-black/80 p-8"
      >
        <!-- Модальное окно -->
        <div
          ref="panel"
          class="flex max-h-full w-max max-w-full flex-col overflow-hidden rounded-xl bg-primary-gray-dark text-primary-white"
        >
          <!-- Шапка модального окна -->
          <header class="flex shrink-0 items-center gap-3 p-4 pb-2">
            <h2
              v-if="props.title"
              class="min-w-0 flex-1 truncate text-xl font-bold leading-none text-primary-white"
            >
              {{ props.title }}
            </h2>
            <UiButton
              class="ml-auto"
              variant="outline"
              icon="X"
              aria-label="Закрыть"
              @click="requestClose"
            />
          </header>

          <!-- Контент модального окна -->
          <div class="min-h-0 flex-1 overflow-y-auto p-4 pt-2">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.35s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: none;
  }
}
</style>
