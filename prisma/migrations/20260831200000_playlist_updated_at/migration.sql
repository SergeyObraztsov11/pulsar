-- Playlist.updatedAt: last meta or track-list change

ALTER TABLE "Playlist" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Playlist" p
SET "updatedAt" = GREATEST(
  p."createdAt",
  COALESCE(
    (
      SELECT MAX(pt."addedAt")
      FROM "PlaylistTrack" pt
      WHERE pt."playlistId" = p."id"
    ),
    p."createdAt"
  )
);
