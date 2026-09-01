import { meetsListenThreshold } from "../../../../app/utils/listenThreshold";
import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/tracks/:id/listen — записать засчитанное прослушивание для текущего пользователя
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.TRACK_ID_REQUIRED);
  }

  const body = await readBody(event).catch(() => null);
  const playedSec = Number(body?.playedSec);
  if (!Number.isFinite(playedSec) || playedSec < 0) {
    throwApiError(400, ApiErrorCode.PLAYED_SEC_REQUIRED);
  }

  const track = await prisma.track.findUnique({
    where: { id },
    select: { id: true, durationSec: true },
  });
  if (!track) {
    throwApiError(404, ApiErrorCode.TRACK_NOT_FOUND);
  }

  const normalizedPlayedSec = Math.floor(playedSec);
  // Порог дублируем на сервере — клиент не доверяем
  if (!meetsListenThreshold(normalizedPlayedSec, track.durationSec)) {
    throwApiError(400, ApiErrorCode.LISTEN_THRESHOLD_NOT_MET);
  }

  await prisma.trackListen.create({
    data: {
      userId,
      trackId: id,
      playedSec: normalizedPlayedSec,
    },
  });

  return { ok: true };
});
