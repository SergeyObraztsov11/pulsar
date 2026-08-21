/**
 * Заполняет БД тестовыми данными (dev).
 * Запуск: npm run db:seed
 * Пароль у всех пользователей: password
 */
import "dotenv/config";
import { Hash } from "@adonisjs/hash";
import { Scrypt } from "@adonisjs/hash/drivers/scrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import {
  albumCoverKey,
  audioObjectKey,
  avatarObjectKey,
  playlistCoverKey,
  SEED_AUDIO_TRACK_IDS,
} from "../app/utils/mediaKeys";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const users = [
  { id: "platina", name: "Платина", avatarSrc: avatarObjectKey("platina") },
  { id: "volna", name: "Волна", avatarSrc: avatarObjectKey("volna") },
  { id: "liniya", name: "Линия", avatarSrc: avatarObjectKey("liniya") },
  { id: "yug", name: "Юг", avatarSrc: avatarObjectKey("yug") },
  { id: "sdvig", name: "Сдвиг", avatarSrc: avatarObjectKey("sdvig") },
  { id: "more", name: "Море", avatarSrc: avatarObjectKey("more") },
  { id: "kadr", name: "Кадр", avatarSrc: avatarObjectKey("kadr") },
  { id: "aura", name: "Аура", avatarSrc: avatarObjectKey("aura") },
  { id: "piksel", name: "Пиксель", avatarSrc: avatarObjectKey("piksel") },
  { id: "severnyy", name: "Северный", avatarSrc: avatarObjectKey("severnyy") },
];

const albums = [
  { id: "valentina", artistId: "platina", name: "Валентина", coverSrc: albumCoverKey("valentina", "jpg") },
  { id: "gorizont", artistId: "volna", name: "Горизонт", coverSrc: albumCoverKey("gorizont", "jpg") },
  { id: "ekho", artistId: "liniya", name: "Эхо", coverSrc: albumCoverKey("ekho", "jpg") },
  { id: "leto-24", artistId: "yug", name: "Лето 24", coverSrc: albumCoverKey("leto-24", "jpg") },
  { id: "na-povtore", artistId: "sdvig", name: "На повторе", coverSrc: albumCoverKey("na-povtore", "jpg") },
  { id: "tishe", artistId: "more", name: "Тише", coverSrc: albumCoverKey("tishe", "jpg") },
  { id: "sdvig-album", artistId: "kadr", name: "Сдвиг", coverSrc: albumCoverKey("sdvig-album", "jpg") },
  { id: "kadr-album", artistId: "aura", name: "Кадр", coverSrc: albumCoverKey("kadr-album", "jpg") },
  { id: "liniya-album", artistId: "piksel", name: "Линия", coverSrc: albumCoverKey("liniya-album", "jpg") },
  { id: "yug-album", artistId: "severnyy", name: "Юг", coverSrc: albumCoverKey("yug-album", "jpg") },
];

const tracks = [
  // Горизонт — Волна
  { id: "track-1", albumId: "gorizont", artistId: "volna", name: "Горизонт", trackNumber: 1, durationSec: 204 },
  { id: "track-11", albumId: "gorizont", artistId: "volna", name: "Дальний свет", trackNumber: 2, durationSec: 188 },
  { id: "track-12", albumId: "gorizont", artistId: "volna", name: "Полоса", trackNumber: 3, durationSec: 216 },
  // Сдвиг — Кадр
  { id: "track-2", albumId: "sdvig-album", artistId: "kadr", name: "Без имени", trackNumber: 1, durationSec: 178 },
  { id: "track-13", albumId: "sdvig-album", artistId: "kadr", name: "Кадр 24", trackNumber: 2, durationSec: 195 },
  { id: "track-14", albumId: "sdvig-album", artistId: "kadr", name: "Пауза", trackNumber: 3, durationSec: 162 },
  // Лето 24 — Юг
  { id: "track-3", albumId: "leto-24", artistId: "yug", name: "Лето 24", trackNumber: 1, durationSec: 221 },
  { id: "track-15", albumId: "leto-24", artistId: "yug", name: "Жара", trackNumber: 2, durationSec: 183 },
  { id: "track-16", albumId: "leto-24", artistId: "yug", name: "После заката", trackNumber: 3, durationSec: 247 },
  // Эхо — Линия
  { id: "track-4", albumId: "ekho", artistId: "liniya", name: "Эхо", trackNumber: 1, durationSec: 242 },
  { id: "track-17", albumId: "ekho", artistId: "liniya", name: "Отзвук", trackNumber: 2, durationSec: 201 },
  { id: "track-18", albumId: "ekho", artistId: "liniya", name: "Тишина между", trackNumber: 3, durationSec: 229 },
  // На повторе — Сдвиг
  { id: "track-5", albumId: "na-povtore", artistId: "sdvig", name: "На повторе", trackNumber: 1, durationSec: 197 },
  { id: "track-19", albumId: "na-povtore", artistId: "sdvig", name: "Ещё раз", trackNumber: 2, durationSec: 174 },
  { id: "track-20", albumId: "na-povtore", artistId: "sdvig", name: "Петля", trackNumber: 3, durationSec: 208 },
  // Тише — Море
  { id: "track-6", albumId: "tishe", artistId: "more", name: "Ночной город", trackNumber: 1, durationSec: 213 },
  { id: "track-21", albumId: "tishe", artistId: "more", name: "Прибой", trackNumber: 2, durationSec: 191 },
  { id: "track-22", albumId: "tishe", artistId: "more", name: "Глубина", trackNumber: 3, durationSec: 256 },
  // Кадр — Аура
  { id: "track-7", albumId: "kadr-album", artistId: "aura", name: "Тише", trackNumber: 1, durationSec: 165 },
  { id: "track-23", albumId: "kadr-album", artistId: "aura", name: "Свет", trackNumber: 2, durationSec: 187 },
  // Валентина — Платина
  { id: "track-8", albumId: "valentina", artistId: "platina", name: "Валентина", trackNumber: 1, durationSec: 189 },
  { id: "track-24", albumId: "valentina", artistId: "platina", name: "Платина", trackNumber: 2, durationSec: 203 },
  { id: "track-25", albumId: "valentina", artistId: "platina", name: "Ночь на районе", trackNumber: 3, durationSec: 218 },
  // Линия — Пиксель
  { id: "track-9", albumId: "liniya-album", artistId: "piksel", name: "До утра", trackNumber: 1, durationSec: 232 },
  { id: "track-26", albumId: "liniya-album", artistId: "piksel", name: "Пиксель", trackNumber: 2, durationSec: 176 },
  // Юг — Северный
  { id: "track-10", albumId: "yug-album", artistId: "severnyy", name: "Сквозь шум", trackNumber: 1, durationSec: 251 },
  { id: "track-27", albumId: "yug-album", artistId: "severnyy", name: "Север", trackNumber: 2, durationSec: 199 },
  { id: "track-28", albumId: "yug-album", artistId: "severnyy", name: "Вьюга", trackNumber: 3, durationSec: 224 },
];

async function main() {
  // Хеш как у nuxt-auth-utils (@adonisjs/hash scrypt)
  const passwordHash = await new Hash(new Scrypt({})).make("password");

  // Сначала чистим (порядок важен из‑за связей)
  await prisma.artistLink.deleteMany();
  await prisma.artistLike.deleteMany();
  await prisma.albumLike.deleteMany();
  await prisma.trackLike.deleteMany();
  await prisma.playlistTrack.deleteMany();
  await prisma.trackGenre.deleteMany();
  await prisma.albumGenre.deleteMany();
  await prisma.track.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.album.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      email: `${user.id}@example.com`,
      passwordHash,
    })),
  });

  await prisma.album.createMany({ data: albums });
  await prisma.track.createMany({
    data: tracks.map((track) => ({
      ...track,
      audioSrc: (SEED_AUDIO_TRACK_IDS as readonly string[]).includes(track.id)
        ? audioObjectKey(track.id)
        : null,
    })),
  });

  await prisma.genre.createMany({
    data: [
      { id: "hip-hop", name: "Hip-Hop", slug: "hip-hop" },
      { id: "pop", name: "Pop", slug: "pop" },
      { id: "rock", name: "Rock", slug: "rock" },
      { id: "electronic", name: "Electronic", slug: "electronic" },
      { id: "r-and-b", name: "R&B", slug: "r-and-b" },
      { id: "indie", name: "Indie", slug: "indie" },
      { id: "jazz", name: "Jazz", slug: "jazz" },
    ],
  });

  await prisma.albumGenre.createMany({
    data: [
      { albumId: "valentina", genreId: "hip-hop" },
      { albumId: "gorizont", genreId: "indie" },
      { albumId: "ekho", genreId: "electronic" },
    ],
  });

  await prisma.trackGenre.createMany({
    data: [
      { trackId: "track-1", genreId: "indie" },
      { trackId: "track-11", genreId: "indie" },
      { trackId: "track-12", genreId: "indie" },
      { trackId: "track-8", genreId: "hip-hop" },
      { trackId: "track-24", genreId: "hip-hop" },
      { trackId: "track-25", genreId: "hip-hop" },
      { trackId: "track-4", genreId: "electronic" },
      { trackId: "track-17", genreId: "electronic" },
      { trackId: "track-18", genreId: "electronic" },
      { trackId: "track-6", genreId: "indie" },
      { trackId: "track-21", genreId: "indie" },
      { trackId: "track-3", genreId: "hip-hop" },
      { trackId: "track-15", genreId: "hip-hop" },
    ],
  });

  await prisma.playlist.createMany({
    data: [
      {
        id: "likes-mix",
        userId: "platina",
        name: "Мне нравится",
        coverSrc: playlistCoverKey("likes-mix"),
        isPublic: false,
      },
      {
        id: "evening",
        userId: "volna",
        name: "Вечерний",
        coverSrc: playlistCoverKey("evening"),
        isPublic: true,
      },
    ],
  });

  await prisma.playlistTrack.createMany({
    data: [
      { playlistId: "likes-mix", trackId: "track-1", position: 1 },
      { playlistId: "likes-mix", trackId: "track-8", position: 2 },
      { playlistId: "likes-mix", trackId: "track-3", position: 3 },
      { playlistId: "evening", trackId: "track-6", position: 1 },
      { playlistId: "evening", trackId: "track-7", position: 2 },
      { playlistId: "evening", trackId: "track-9", position: 3 },
    ],
  });

  await prisma.trackLike.createMany({
    data: [
      { userId: "platina", trackId: "track-1" },
      { userId: "platina", trackId: "track-8" },
      { userId: "volna", trackId: "track-6" },
    ],
  });

  await prisma.albumLike.createMany({
    data: [
      { userId: "volna", albumId: "valentina" },
      { userId: "platina", albumId: "gorizont" },
    ],
  });

  await prisma.artistLike.createMany({
    data: [
      { userId: "volna", artistId: "platina" },
      { userId: "platina", artistId: "volna" },
    ],
  });

  console.log("Seed OK: users, albums, tracks, genres, playlists, likes");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
