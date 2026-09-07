-- Reverse positions for liked_tracks so visual order (was addedAt desc) stays
-- under position asc: temp offset avoids unique (playlistId, position) collisions.

UPDATE "PlaylistTrack" AS pt
SET "position" = pt."position" + 1000000
FROM "Playlist" AS p
WHERE pt."playlistId" = p."id"
  AND p."systemKind" = 'liked_tracks';

UPDATE "PlaylistTrack" AS pt
SET "position" = sub.new_pos
FROM (
  SELECT
    pt2."playlistId",
    pt2."trackId",
    (
      COUNT(*) OVER (PARTITION BY pt2."playlistId")
      - 1
      - (pt2."position" - 1000000)
    )::int AS new_pos
  FROM "PlaylistTrack" AS pt2
  INNER JOIN "Playlist" AS p2 ON p2."id" = pt2."playlistId"
  WHERE p2."systemKind" = 'liked_tracks'
) AS sub
WHERE pt."playlistId" = sub."playlistId"
  AND pt."trackId" = sub."trackId";
