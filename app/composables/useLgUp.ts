import { useMediaQuery } from "@vueuse/core";

/**
 * Tailwind `lg` (≥1024px).
 * До mount возвращает true (desktop), чтобы SSR и гидрация не расходились:
 * useMediaQuery на сервере всегда false.
 */
export function useLgUp() {
  const matches = useMediaQuery("(min-width: 1024px)");
  const ready = ref(false);

  onMounted(() => {
    ready.value = true;
  });

  return computed(() => (ready.value ? matches.value : true));
}
