/**
 * listenThreshold — порог засчитанного прослушивания.
 * Общие правила для клиента (useTrackListen) и POST /api/tracks/:id/listen.
 */
export const LISTEN_MIN_SEC = 30;

export const LISTEN_MIN_RATIO = 0.5;

/** Достигнут ли порог: ≥30 сек или ≥50% длительности */
export function meetsListenThreshold(
  playedSec: number,
  durationSec: number,
): boolean {
  if (!Number.isFinite(playedSec) || playedSec < 1) return false;
  if (playedSec >= LISTEN_MIN_SEC) return true;
  if (durationSec > 0 && playedSec >= durationSec * LISTEN_MIN_RATIO) {
    return true;
  }
  return false;
}
