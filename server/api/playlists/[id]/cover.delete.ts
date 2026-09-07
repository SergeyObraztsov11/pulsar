import { playlistCoverKey } from "~/utils/mediaKeys";
import {
  requireEditableUserPlaylist,
  serializePlaylistSummary,
} from "../../../utils/playlistDetail";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";
import { deleteS3Object } from "../../../utils/s3";

/**
 * DELETE /api/playlists/:id/cover — remove custom cover
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.PLAYLIST_ID_REQUIRED);
  }

  await requireEditableUserPlaylist(event, id);

  const playlist = await prisma.playlist.findUniqueOrThrow({
    where: { id },
    select: { coverSrc: true },
  });

  const expectedKey = playlistCoverKey(id);
  if (playlist.coverSrc && playlist.coverSrc === expectedKey) {
    await deleteS3Object(playlist.coverSrc).catch(() => {});
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data: { coverSrc: null, coverColor: null },
    include: { _count: { select: { tracks: true } } },
  });

  return serializePlaylistSummary(updated);
});
