/**
 * Idempotent seed: imports five real albums from seed-albums/ into Postgres + MinIO.
 * Does NOT wipe existing users/albums/tracks. Re-runs upsert seed-owned rows and overwrite S3 objects.
 * Only manifest.albums are imported — seed-albums/extras/ is archived media and is skipped.
 *
 * Prepare media (optional refresh): node scripts/prepare-seed-albums.mjs [--source <dir>]
 * Run: npm run db:seed
 *
 * Password for seed artists: password
 * Legacy wipe seed kept at prisma/seed.legacy.ts (do not run against a used DB).
 */
import "dotenv/config";
import { Hash } from "@adonisjs/hash";
import { Scrypt } from "@adonisjs/hash/drivers/scrypt";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { PrismaClient } from "../app/generated/prisma/client";
import {
  albumCoverKey,
  audioObjectKey,
  avatarObjectKey,
} from "../app/utils/mediaKeys";

type SeedTrack = {
  id: string;
  trackNumber: number;
  name: string;
  file: string;
  durationSec: number;
  isExplicit?: boolean;
};

type SeedAlbum = {
  id: string;
  folder: string;
  name: string;
  releaseDate?: string;
  genreIds: string[];
  isExplicit: boolean;
  coverFile: string;
  artist: { id: string; name: string; email: string };
  tracks: SeedTrack[];
};

type SeedManifest = {
  albums: SeedAlbum[];
};

const GENRES = [
  { id: "hip-hop", name: "Hip-Hop", slug: "hip-hop" },
  { id: "pop", name: "Pop", slug: "pop" },
  { id: "rock", name: "Rock", slug: "rock" },
] as const;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const endpoint = process.env.NUXT_S3_ENDPOINT;
const region = process.env.NUXT_S3_REGION || "us-east-1";
const accessKey = process.env.NUXT_S3_ACCESS_KEY;
const secretKey = process.env.NUXT_S3_SECRET_KEY;
const bucket = process.env.NUXT_S3_BUCKET;

if (!endpoint || !accessKey || !secretKey || !bucket) {
  throw new Error("NUXT_S3_* is not set (endpoint, keys, bucket)");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const s3 = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true,
});

const seedRoot = path.join(process.cwd(), "seed-albums");

async function putObject(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

async function durationSecFromFile(filePath: string) {
  const meta = await parseFile(filePath);
  const sec = meta.format.duration;
  if (sec == null || !Number.isFinite(sec) || sec < 0) {
    throw new Error(`Could not read duration: ${filePath}`);
  }
  return Math.round(sec);
}

/** Match API upload: square WebP cover + accent hex for hero. */
async function processCover(input: Buffer) {
  const body = await sharp(input)
    .rotate()
    .resize(800, 800, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer();
  const { dominant } = await sharp(body).stats();
  const coverColor = `#${[dominant.r, dominant.g, dominant.b]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
  return { body, coverColor };
}

async function processAvatar(input: Buffer) {
  const body = await sharp(input)
    .rotate()
    .resize(512, 512, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toBuffer();
  const { dominant } = await sharp(body).stats();
  const avatarColor = `#${[dominant.r, dominant.g, dominant.b]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
  return { body, avatarColor };
}

async function loadManifest(): Promise<SeedManifest> {
  const manifestPath = path.join(seedRoot, "manifest.json");
  try {
    await access(manifestPath);
  } catch {
    throw new Error(
      `Missing ${manifestPath}. Run: node scripts/prepare-seed-albums.mjs`,
    );
  }
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as SeedManifest;
  if (!Array.isArray(manifest.albums) || manifest.albums.length === 0) {
    throw new Error("seed-albums/manifest.json has no albums");
  }
  return manifest;
}

async function ensureGenre(genre: (typeof GENRES)[number]) {
  const bySlug = await prisma.genre.findUnique({ where: { slug: genre.slug } });
  if (bySlug) return bySlug.id;

  const byId = await prisma.genre.findUnique({ where: { id: genre.id } });
  if (byId) return byId.id;

  await prisma.genre.create({
    data: { id: genre.id, name: genre.name, slug: genre.slug },
  });
  return genre.id;
}

async function ensureLikedPlaylist(userId: string) {
  const existing = await prisma.playlist.findFirst({
    where: { userId, systemKind: "liked_tracks" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.playlist.create({
    data: {
      id: `liked-${userId}`,
      userId,
      name: "Мне нравится",
      isPublic: false,
      systemKind: "liked_tracks",
    },
  });
  return created.id;
}

async function upsertArtist(
  artist: SeedAlbum["artist"],
  passwordHash: string,
  coverBuffer: Buffer,
) {
  const avatar = await processAvatar(coverBuffer);
  const avatarSrc = avatarObjectKey(artist.id);
  await putObject(avatarSrc, avatar.body, "image/jpeg");

  // Password only on create so re-seed does not reset a changed artist password.
  await prisma.user.upsert({
    where: { id: artist.id },
    create: {
      id: artist.id,
      email: artist.email,
      name: artist.name,
      passwordHash,
      avatarSrc,
      avatarColor: avatar.avatarColor,
    },
    update: {
      name: artist.name,
      email: artist.email,
      avatarSrc,
      avatarColor: avatar.avatarColor,
    },
  });

  await ensureLikedPlaylist(artist.id);
}

async function seedAlbum(
  album: SeedAlbum,
  genreIdBySlug: Map<string, string>,
) {
  const folder = path.join(seedRoot, album.folder);
  const coverPath = path.join(folder, album.coverFile);
  const coverBuffer = await readFile(coverPath);
  const cover = await processCover(coverBuffer);
  const coverSrc = albumCoverKey(album.id, "webp");
  await putObject(coverSrc, cover.body, "image/webp");
  console.log("put", coverSrc);

  await prisma.album.upsert({
    where: { id: album.id },
    create: {
      id: album.id,
      artistId: album.artist.id,
      name: album.name,
      coverSrc,
      coverColor: cover.coverColor,
      releaseDate: album.releaseDate ? new Date(album.releaseDate) : null,
      isExplicit: album.isExplicit,
    },
    update: {
      artistId: album.artist.id,
      name: album.name,
      coverSrc,
      coverColor: cover.coverColor,
      releaseDate: album.releaseDate ? new Date(album.releaseDate) : null,
      isExplicit: album.isExplicit,
    },
  });

  for (const genreSlug of album.genreIds) {
    const genreId = genreIdBySlug.get(genreSlug);
    if (!genreId) {
      throw new Error(`Genre not prepared: ${genreSlug}`);
    }
    await prisma.albumGenre.upsert({
      where: {
        albumId_genreId: { albumId: album.id, genreId },
      },
      create: { albumId: album.id, genreId },
      update: {},
    });
  }

  for (const track of album.tracks) {
    const audioPath = path.join(folder, track.file);
    await access(audioPath).catch(() => {
      throw new Error(`Missing audio file: ${audioPath}`);
    });

    const durationSec = await durationSecFromFile(audioPath);
    const audioBody = await readFile(audioPath);
    const audioSrc = audioObjectKey(track.id);
    await putObject(audioSrc, audioBody, "audio/mpeg");
    console.log("put", audioSrc, `(${durationSec}s)`);

    await prisma.track.upsert({
      where: { id: track.id },
      create: {
        id: track.id,
        albumId: album.id,
        artistId: album.artist.id,
        name: track.name,
        trackNumber: track.trackNumber,
        durationSec,
        audioSrc,
        isExplicit: track.isExplicit ?? album.isExplicit,
      },
      update: {
        albumId: album.id,
        artistId: album.artist.id,
        name: track.name,
        trackNumber: track.trackNumber,
        durationSec,
        audioSrc,
        isExplicit: track.isExplicit ?? album.isExplicit,
      },
    });
  }

  return { coverBuffer };
}

async function main() {
  const manifest = await loadManifest();
  const passwordHash = await new Hash(new Scrypt({})).make("password");

  const genreIdBySlug = new Map<string, string>();
  for (const genre of GENRES) {
    const id = await ensureGenre(genre);
    genreIdBySlug.set(genre.slug, id);
  }

  // Artists first (unique email). Same artist reused across albums if needed.
  const artistsDone = new Set<string>();
  for (const album of manifest.albums) {
    if (artistsDone.has(album.artist.id)) continue;
    const coverPath = path.join(seedRoot, album.folder, album.coverFile);
    const coverBuffer = await readFile(coverPath);
    await upsertArtist(album.artist, passwordHash, coverBuffer);
    artistsDone.add(album.artist.id);
    console.log("artist", album.artist.id);
  }

  let trackCount = 0;
  for (const album of manifest.albums) {
    console.log(`\nAlbum ${album.id} (${album.tracks.length} tracks)`);
    await seedAlbum(album, genreIdBySlug);
    trackCount += album.tracks.length;
  }

  console.log(
    `\nSeed OK (idempotent): ${manifest.albums.length} albums, ${trackCount} tracks, media in MinIO bucket "${bucket}"`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
