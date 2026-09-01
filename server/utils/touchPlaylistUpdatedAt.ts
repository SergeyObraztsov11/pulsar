/** Bump playlist.updatedAt after track list changes */
export async function touchPlaylistUpdatedAt(
  playlistId: string,
  tx: Pick<typeof prisma, "playlist"> = prisma,
) {
  await tx.playlist.update({
    where: { id: playlistId },
    data: { updatedAt: new Date() },
  });
}
