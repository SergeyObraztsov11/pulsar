import { requireAuthUserId } from "../../utils/getAuthUserId";
import {
  PLAYLIST_DESCRIPTION_MAX_LENGTH,
  PLAYLIST_NAME_MAX_LENGTH,
  requireEditableUserPlaylist,
  serializePlaylistSummary,
} from "../../utils/playlistDetail";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";

/**
 * PATCH /api/playlists/:id — name, description, visibility (user playlists only)
 * Body: { name?, description?, isPublic? }
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.PLAYLIST_ID_REQUIRED);
  }

  requireAuthUserId(event);
  await requireEditableUserPlaylist(event, id);

  const body = await readBody<{
    name?: string;
    description?: string | null;
    isPublic?: boolean;
  }>(event);

  const data: {
    name?: string;
    description?: string | null;
    isPublic?: boolean;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length > PLAYLIST_NAME_MAX_LENGTH) {
      throwApiError(400, ApiErrorCode.PLAYLIST_NAME_REQUIRED);
    }
    data.name = name;
  }

  if (body.description !== undefined) {
    const descriptionRaw =
      body.description == null ? "" : String(body.description).trim();
    const description = descriptionRaw ? descriptionRaw : null;
    if (
      description &&
      description.length > PLAYLIST_DESCRIPTION_MAX_LENGTH
    ) {
      throwApiError(400, ApiErrorCode.PLAYLIST_DESCRIPTION_TOO_LONG);
    }
    data.description = description;
  }

  if (body.isPublic !== undefined) {
    data.isPublic = body.isPublic === true;
  }

  if (Object.keys(data).length === 0) {
    throwApiError(400, ApiErrorCode.NO_FIELDS_TO_UPDATE);
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data,
    include: { _count: { select: { tracks: true } } },
  });

  return serializePlaylistSummary(updated);
});
