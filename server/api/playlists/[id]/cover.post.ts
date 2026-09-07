import { playlistCoverKey } from "~/utils/mediaKeys";
import { processAlbumCover } from "../../../utils/processCover";
import {
  PLAYLIST_COVER_MAX_BYTES,
  requireEditableUserPlaylist,
  serializePlaylistSummary,
} from "../../../utils/playlistDetail";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";
import { deleteS3Object, putS3Object } from "../../../utils/s3";

/**
 * POST /api/playlists/:id/cover — upload playlist cover (multipart, field cover)
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.PLAYLIST_ID_REQUIRED);
  }

  await requireEditableUserPlaylist(event, id);

  const parts = await readMultipartFormData(event);
  const part = parts?.find((item) => item.name === "cover" && item.filename);
  if (!part?.data?.length) {
    throwApiError(400, ApiErrorCode.MULTIPART_FORM_REQUIRED);
  }
  if (part.data.length > PLAYLIST_COVER_MAX_BYTES) {
    throwApiError(400, ApiErrorCode.PLAYLIST_COVER_TOO_LARGE);
  }

  const playlist = await prisma.playlist.findUniqueOrThrow({
    where: { id },
    select: { coverSrc: true },
  });

  const { body, coverColor } = await processAlbumCover(part.data);
  const key = playlistCoverKey(id);

  await putS3Object({ key, body, contentType: "image/webp" });

  if (playlist.coverSrc && playlist.coverSrc !== key) {
    await deleteS3Object(playlist.coverSrc).catch(() => {});
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data: { coverSrc: key, coverColor },
    include: { _count: { select: { tracks: true } } },
  });

  return serializePlaylistSummary(updated);
});
