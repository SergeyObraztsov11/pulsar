<script setup lang="ts">
/**
 * ModalLayout — оболочка модалки (затемнение, title, крестик).
 *
 * Не закрывает сама: крестик / клик снаружи → emit('close').
 * Контент модалки слушает @close и решает, вызывать ли useModal().close().
 * Панель растягивается под контент (потолок — viewport).
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

function requestClose() {
  emit("close");
}

onClickOutside(panel, () => {
  requestClose();
});
</script>

<template>
  <Teleport to="body">
    <!-- Затемнение -->
    <div
      class="fixed inset-0 z-100 flex items-center justify-center bg-primary-black/80 p-8"
    >
      <!-- Модальное окно -->
      <div
        ref="panel"
        class="flex max-h-full w-max max-w-full flex-col overflow-hidden rounded-xl bg-primary-gray-dark text-primary-white"
      >
        <!-- Шапка модального окна -->
        <header class="flex shrink-0 items-center p-4">
          <h2
            v-if="props.title"
            class="min-w-0 flex-1 font-bold leading-none text-primary-gray"
          >
            {{ props.title }}
          </h2>
          <UiButton
            class="ml-auto"
            variant="ghost"
            icon="X"
            aria-label="Закрыть"
            @click="requestClose"
          />
        </header>

        <!-- Контент модального окна -->
        <div class="p-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
