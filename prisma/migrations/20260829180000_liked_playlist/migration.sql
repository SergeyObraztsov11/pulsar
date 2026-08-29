-- CreateEnum
CREATE TYPE "PlaylistSystemKind" AS ENUM ('liked_tracks');

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN "systemKind" "PlaylistSystemKind";

-- AlterTable
ALTER TABLE "PlaylistTrack" ADD COLUMN "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate TrackLike → system playlist «Любимые»
INSERT INTO "Playlist" ("id", "userId", "name", "isPublic", "createdAt", "systemKind")
SELECT DISTINCT
  'liked-' || tl."userId",
  tl."userId",
  'Любимые',
  false,
  NOW(),
  'liked_tracks'::"PlaylistSystemKind"
FROM "TrackLike" tl
WHERE NOT EXISTS (
  SELECT 1 FROM "Playlist" p
  WHERE p."userId" = tl."userId" AND p."systemKind" = 'liked_tracks'
);

INSERT INTO "PlaylistTrack" ("playlistId", "trackId", "position", "addedAt")
SELECT
  sub."playlistId",
  sub."trackId",
  sub."position",
  sub."addedAt"
FROM (
  SELECT
    'liked-' || tl."userId" AS "playlistId",
    tl."trackId",
    (ROW_NUMBER() OVER (PARTITION BY tl."userId" ORDER BY tl."createdAt" DESC) - 1)::INTEGER AS "position",
    tl."createdAt" AS "addedAt"
  FROM "TrackLike" tl
) sub
ON CONFLICT ("playlistId", "trackId") DO NOTHING;

-- One liked_tracks playlist per user
CREATE UNIQUE INDEX "Playlist_userId_liked_tracks_key"
  ON "Playlist"("userId")
  WHERE "systemKind" = 'liked_tracks';

CREATE INDEX "PlaylistTrack_playlistId_addedAt_idx"
  ON "PlaylistTrack"("playlistId", "addedAt");

-- Drop TrackLike
DROP TABLE "TrackLike";
