type PlaylistTrackTx = Pick<
  typeof prisma,
  "playlistTrack"
>;

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
