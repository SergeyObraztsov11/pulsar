type PlaylistTrackTx = Pick<typeof prisma, "playlistTrack">;

/** Close gap after delete without unique (playlistId, position) collisions */
export async function compactPlaylistPositionsAfterDelete(
  tx: PlaylistTrackTx,
  playlistId: string,
  removedPosition: number,
) {
  const rows = await tx.playlistTrack.findMany({
    where: { playlistId, position: { gt: removedPosition } },
    orderBy: { position: "asc" },
    select: { trackId: true, position: true },
  });

  for (const row of rows) {
    await tx.playlistTrack.update({
      where: { playlistId_trackId: { playlistId, trackId: row.trackId } },
      data: { position: row.position - 1 },
    });
  }
}

/** Make room at insertPosition by shifting existing rows up one-by-one */
export async function shiftPlaylistPositionsForInsert(
  tx: PlaylistTrackTx,
  playlistId: string,
  insertPosition: number,
) {
  const rows = await tx.playlistTrack.findMany({
    where: { playlistId, position: { gte: insertPosition } },
    orderBy: { position: "desc" },
    select: { trackId: true, position: true },
  });

  for (const row of rows) {
    await tx.playlistTrack.update({
      where: { playlistId_trackId: { playlistId, trackId: row.trackId } },
      data: { position: row.position + 1 },
    });
  }
}

const POSITION_TEMP_OFFSET = 1_000_000;

/**
 * Переставить трек на toIndex (0-based в упорядоченном списке).
 * Сначала все position += offset, потом 0..n−1 — без unique-коллизий.
 */
export async function movePlaylistTrack(
  tx: PlaylistTrackTx,
  playlistId: string,
  trackId: string,
  toIndex: number,
) {
  const rows = await tx.playlistTrack.findMany({
    where: { playlistId },
    orderBy: { position: "asc" },
    select: { trackId: true, position: true },
  });

  const fromIndex = rows.findIndex((row) => row.trackId === trackId);
  if (fromIndex < 0) return;
  if (toIndex < 0 || toIndex >= rows.length) return;
  if (fromIndex === toIndex) return;

  const ordered = rows.map((row) => row.trackId);
  ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, trackId);

  for (const row of rows) {
    await tx.playlistTrack.update({
      where: { playlistId_trackId: { playlistId, trackId: row.trackId } },
      data: { position: row.position + POSITION_TEMP_OFFSET },
    });
  }

  for (let index = 0; index < ordered.length; index++) {
    const id = ordered[index];
    if (!id) continue;
    await tx.playlistTrack.update({
      where: { playlistId_trackId: { playlistId, trackId: id } },
      data: { position: index },
    });
  }
}
