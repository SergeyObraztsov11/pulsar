import {
  useResizeObserver,
  type MaybeRefOrGetter,
  type WatchSource,
} from "@vueuse/core";

type UseFitTextOptions = {
  /** Максимальный размер (px), напр. 48 = text-5xl, 96 = text-8xl */
  maxPx: MaybeRefOrGetter<number>;
  /** Нижняя граница, дальше не сжимаем */
  minPx?: MaybeRefOrGetter<number>;
  /** Доп. триггеры пересчёта (текст и т.п.) */
  watchSources?: WatchSource[];
};

/**
 * Подгоняет font-size под ширину: максимум, пока влезает в одну строку;
 * уменьшает только если текст шире контейнера.
 * До layout / при ширине 0 — оставляем max (без вспышки min→max).
 */
export function useFitText(
  el: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseFitTextOptions,
) {
  const minPx = computed(() => toValue(options.minPx) ?? 24);
  /** null = ещё не мерили → рисуем max */
  const fittedPx = ref<number | null>(null);

  const style = computed(() => ({
    fontSize: `${fittedPx.value ?? toValue(options.maxPx)}px`,
    whiteSpace: "nowrap" as const,
  }));

  function fit() {
    const node = toValue(el);
    if (!node) return;

    const max = toValue(options.maxPx);
    const min = minPx.value;

    // Контейнер ещё не в layout — не сжимаем до min
    if (node.clientWidth < 1) {
      fittedPx.value = max;
      return;
    }

    node.style.whiteSpace = "nowrap";
    node.style.fontSize = `${max}px`;

    if (node.scrollWidth <= node.clientWidth + 0.5) {
      fittedPx.value = max;
      return;
    }

    let lo = min;
    let hi = max;
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      node.style.fontSize = `${mid}px`;
      if (node.scrollWidth <= node.clientWidth + 0.5) lo = mid;
      else hi = mid;
    }

    fittedPx.value = lo;
    node.style.fontSize = `${lo}px`;
  }

  /** После layout: два кадра, чтобы flex успел выставить ширину */
  function scheduleFit() {
    requestAnimationFrame(() => {
      fit();
      requestAnimationFrame(fit);
    });
  }

  useResizeObserver(el, () => {
    scheduleFit();
  });

  watch(
    () => [
      toValue(el),
      toValue(options.maxPx),
      minPx.value,
      ...(options.watchSources ?? []).map((source) => toValue(source)),
    ],
    () => {
      void nextTick(scheduleFit);
    },
  );

  onMounted(() => {
    void nextTick(scheduleFit);
  });

  return { style };
}
