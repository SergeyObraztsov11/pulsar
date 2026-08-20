export default defineNuxtPlugin(() => {
  const route = useRoute();
  const playerStore = usePlayerStore();

  watch(
    () => route.fullPath,
    () => {
      if (playerStore.isExpanded) playerStore.closeExpanded();
    },
  );
});
