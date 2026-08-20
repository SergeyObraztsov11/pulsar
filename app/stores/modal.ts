import type { Component } from "vue";

export type ModalOpenOptions<P extends object = Record<string, never>> = {
  component: Component;
  /** Данные для модалки — тип берёшь из самой модалки (ModalShareAlbumProps и т.д.) */
  props?: P;
};

/**
 * Глобальное состояние модалки.
 * ModalHost в app.vue рендерит component; закрытие — через close() из контента.
 */
export const useModalStore = defineStore("modal", () => {
  const isOpen = ref(false);
  const component = shallowRef<Component | null>(null);
  const props = ref<Record<string, unknown>>({});

  function open<P extends object>(options: ModalOpenOptions<P>) {
    component.value = markRaw(options.component);
    props.value = (options.props ?? {}) as Record<string, unknown>;
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
    component.value = null;
    props.value = {};
  }

  return {
    isOpen,
    component,
    props,
    open,
    close,
  };
});
