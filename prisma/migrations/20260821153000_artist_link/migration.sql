-- CreateEnum
CREATE TYPE "ArtistLinkKind" AS ENUM ('spotify', 'appleMusic', 'yandexMusic', 'instagram', 'telegram', 'youtube', 'tiktok', 'vk');

-- CreateTable
CREATE TABLE "ArtistLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ArtistLinkKind" NOT NULL,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistLink_userId_sortOrder_idx" ON "ArtistLink"("userId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ArtistLink" ADD CONSTRAINT "ArtistLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
