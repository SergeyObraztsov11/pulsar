-- AlterTable
ALTER TABLE "Playlist" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Playlist_userId_systemKind_idx" ON "Playlist"("userId", "systemKind");
