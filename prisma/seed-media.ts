/**
 * Заливает public/audio и public/covers в MinIO (бакет media).
 * Запуск: npx tsx prisma/seed-media.ts
 */
import "dotenv/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  albumCoverKey,
  audioObjectKey,
  avatarObjectKey,
  playlistCoverKey,
  SEED_AUDIO_TRACK_IDS,
  SEED_COVER_MAP,
  SEED_PLAYLIST_COVERS,
} from "../app/utils/mediaKeys";

const endpoint = process.env.NUXT_S3_ENDPOINT;
const region = process.env.NUXT_S3_REGION || "us-east-1";
const accessKey = process.env.NUXT_S3_ACCESS_KEY;
const secretKey = process.env.NUXT_S3_SECRET_KEY;
const bucket = process.env.NUXT_S3_BUCKET;

if (!endpoint || !accessKey || !secretKey || !bucket) {
  throw new Error("NUXT_S3_* is not set");
}

const client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true,
});

const root = path.join(process.cwd());
const audioDir = path.join(root, "public", "audio");
const coversDir = path.join(root, "public", "covers");

/** Загрузить файл в бакет */
async function put(key: string, body: Buffer, contentType: string) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  console.log("put", key);
}

async function main() {
  const mp3Names = (await readdir(audioDir))
    .filter((name) => name.toLowerCase().endsWith(".mp3"))
    .sort((a, b) => a.localeCompare(b, "ru"));

  for (let i = 0; i < mp3Names.length; i += 1) {
    const trackId = SEED_AUDIO_TRACK_IDS[i];
    if (!trackId) {
      console.warn("skip extra mp3", mp3Names[i]);
      continue;
    }
    const body = await readFile(path.join(audioDir, mp3Names[i]));
    await put(audioObjectKey(trackId), body, "audio/mpeg");
  }

  for (const row of SEED_COVER_MAP) {
    const body = await readFile(path.join(coversDir, row.file));
    await put(albumCoverKey(row.albumId, "jpg"), body, "image/jpeg");
    await put(avatarObjectKey(row.userId), body, "image/jpeg");
  }

  for (const row of SEED_PLAYLIST_COVERS) {
    const body = await readFile(path.join(coversDir, row.file));
    await put(playlistCoverKey(row.playlistId), body, "image/jpeg");
  }

  console.log("Seed media OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
