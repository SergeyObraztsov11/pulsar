/**
 * Открытие модалки.
 *
 * 1. Импортируешь компонент и его тип props
 * 2. Вызываешь open с generic = этот тип
 * 3. В props подставляешь нужные поля
 *
 * @example
 * import ModalShareAlbum, {
 *   type ModalShareAlbumProps,
 * } from '~/components/modals/ModalShareAlbum.vue'
 *
 * open<ModalShareAlbumProps>({
 *   component: ModalShareAlbum,
 *   props: { albumName: 'Валентина' },
 * })
 */
export function useModal() {
  const modalStore = useModalStore();

  return {
    isOpen: computed(() => modalStore.isOpen),
    open: modalStore.open,
    close: modalStore.close,
  };
}
