/**
 * Show short desktop toasts from actions anywhere in the app.
 *
 * @example
 * const { toast } = useToast()
 * toast({ title: "Ссылка скопирована" })
 */
export function useToast() {
  const toastStore = useToastStore();

  return {
    items: computed(() => toastStore.items),
    toast: toastStore.toast,
    dismiss: toastStore.dismiss,
  };
}
