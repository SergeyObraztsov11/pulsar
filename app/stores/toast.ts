export type ToastItem = {
  id: string;
  title: string;
};

export type ToastOptions = {
  title: string;
  /** Auto-dismiss; default 4000 ms */
  durationMs?: number;
};

const MAX_TOASTS = 3;
const DEFAULT_DURATION_MS = 4000;

/**
 * Global toast queue.
 * AppToasts in app.vue renders the stack; call toast() from anywhere.
 */
export const useToastStore = defineStore("toast", () => {
  const items = ref<ToastItem[]>([]);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function dismiss(id: string) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    items.value = items.value.filter((item) => item.id !== id);
  }

  /** Newest on top; max 3 visible */
  function toast({ title, durationMs = DEFAULT_DURATION_MS }: ToastOptions) {
    while (items.value.length >= MAX_TOASTS) {
      const oldest = items.value.at(-1);
      if (!oldest) break;
      dismiss(oldest.id);
    }

    const id = crypto.randomUUID();
    items.value.unshift({ id, title });

    timers.set(
      id,
      setTimeout(() => dismiss(id), durationMs),
    );
  }

  return {
    items,
    toast,
    dismiss,
  };
});
