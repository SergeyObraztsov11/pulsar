/**
 * useTrackListen — учёт засчитанных прослушиваний по состоянию playerStore.
 * Вызывать один раз из AppAudioHost: audio и scrobble живут вместе.
 */
export function useTrackListen() {
  if (!import.meta.client) return;

  const playerStore = usePlayerStore();
  const { loggedIn } = useUserSession();

  /** Уже отправили listen за текущий проход по треку */
  const hasRecorded = ref(false);
  /** Параллельный POST не шлём */
  let pending = false;

  watch(
    () => playerStore.current?.id,
    () => {
      hasRecorded.value = false;
    },
  );

  /** Перемотка назад — новый проход, можно снова засчитать */
  watch(
    () => playerStore.currentTime,
    (time, prev) => {
      if (prev != null && time < prev - 2) {
        hasRecorded.value = false;
      }
    },
  );

  watchEffect(() => {
    if (!loggedIn.value || hasRecorded.value || pending) return;

    const track = playerStore.current;
    if (!track || !playerStore.isPlaying) return;

    const durationSec = playerStore.duration || track.durationSec;
    const playedSec = Math.floor(playerStore.currentTime);
    if (!meetsListenThreshold(playedSec, durationSec)) return;

    hasRecorded.value = true;
    pending = true;

    void $fetch(`/api/tracks/${track.id}/listen`, {
      method: "POST",
      body: { playedSec },
    })
      .catch(() => {
        // Ошибка сети / 401 — попробуем снова при следующем пороге
        hasRecorded.value = false;
      })
      .finally(() => {
        pending = false;
      });
  });
}
