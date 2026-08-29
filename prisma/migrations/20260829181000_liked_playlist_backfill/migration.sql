-- «Любимые» для всех пользователей, у кого ещё нет system playlist
INSERT INTO "Playlist" ("id", "userId", "name", "isPublic", "createdAt", "systemKind")
SELECT
  'liked-' || u."id",
  u."id",
  'Любимые',
  false,
  NOW(),
  'liked_tracks'::"PlaylistSystemKind"
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1
  FROM "Playlist" p
  WHERE p."userId" = u."id"
    AND p."systemKind" = 'liked_tracks'
);
