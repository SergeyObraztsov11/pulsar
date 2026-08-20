/**
 * Закрывает меню, когда триггер скрыт (например display:none при смене breakpoint),
 * но не при размонтировании самого меню.
 */
import { useElementVisibility } from "@vueuse/core";
import type { Ref } from "vue";

/**
 * Следит за видимостью якоря и сбрасывает open.
 * @param reference — DOM-якорь триггера
 * @param open — v-model открытости меню
 */
export function useMenuCloseOnHidden(
  reference: Ref<HTMLElement | null>,
  open: Ref<boolean>,
) {
  /** Виден ли якорь в viewport / layout */
  const referenceVisible = useElementVisibility(reference);

  /** true на время unmount — не закрывать из-за ложного invisible */
  let isUnmounting = false;

  onBeforeUnmount(() => {
    isUnmounting = true;
  });

  watch(referenceVisible, (visible) => {
    if (isUnmounting || visible || !open.value) return;
    open.value = false;
  });
}
