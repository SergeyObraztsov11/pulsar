-- CreateTable
CREATE TABLE "TrackListen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "listenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playedSec" INTEGER NOT NULL,

    CONSTRAINT "TrackListen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackListen_userId_listenedAt_idx" ON "TrackListen"("userId", "listenedAt");

-- CreateIndex
CREATE INDEX "TrackListen_trackId_listenedAt_idx" ON "TrackListen"("trackId", "listenedAt");

-- CreateIndex
CREATE INDEX "TrackListen_trackId_idx" ON "TrackListen"("trackId");

-- AddForeignKey
ALTER TABLE "TrackListen" ADD CONSTRAINT "TrackListen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackListen" ADD CONSTRAINT "TrackListen_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
