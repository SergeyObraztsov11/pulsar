/**
 * POST /api/albums — создать альбом с треками и файлами.
 *
 * Клиент шлёт multipart (не JSON): name, опц. cover, треки name+mp3.
 * Обложка → WebP 800×800. Длительность трека — из файла.
 *
 * Сначала строки в БД (cuid), потом объекты в MinIO.
 * После put ключ сразу в откат: если update упал, файл всё равно удалится.
 */
import { albumCoverKey, audioObjectKey } from "../../utils/s3";
import {
  albumDetailInclude,
  serializeAlbumDetail,
} from "../../utils/albumDetail";
import { durationSecFromAudio } from "../../utils/durationSecFromAudio";
import { processAlbumCover } from "../../utils/processCover";

const COVER_MAX_BYTES = 10 * 1024 * 1024;
const AUDIO_MAX_BYTES = 30 * 1024 * 1024;
const TOTAL_MAX_BYTES = 200 * 1024 * 1024;
const NAME_MAX = 120;
const MAX_TRACKS = 20;

const TRACK_FIELD = /^tracks\[(\d+)\]\[(\w+)\]$/;

type FilePart = { data: Buffer; type?: string };

type TrackDraft = {
  name?: string;
  isExplicit?: boolean;
  audio?: FilePart;
};

type TrackInput = {
  name: string;
  trackNumber: number;
  isExplicit: boolean;
  audio: FilePart;
};

type AlbumForm = {
  name: string;
  cover?: FilePart;
  tracks: TrackInput[];
};

type MultipartPart = {
  name?: string;
  filename?: string;
  type?: string;
  data: Buffer;
};

export default defineEventHandler(async (event) => {
  const artistId = await requireArtist(event);
  const form = await readAlbumForm(event);

  const album = await prisma.album.create({
    data: { name: form.name, artistId },
  });

  await saveCoverAndTracks(album.id, artistId, form);

  const created = await prisma.album.findUniqueOrThrow({
    where: { id: album.id },
    include: albumDetailInclude(artistId),
  });
  return serializeAlbumDetail(created);
});

/** Сессия есть, пользователь должен быть в БД (после seed сессия может протухнуть) */
async function requireArtist(event: Parameters<typeof requireAuthUserId>[0]) {
  const artistId = requireAuthUserId(event);
  const artist = await prisma.user.findUnique({
    where: { id: artistId },
    select: { id: true },
  });
  if (!artist) {
    await clearUserSession(event);
    throw createError({ statusCode: 401, statusMessage: "User not found" });
  }
  return artistId;
}

/** Body → { name, cover, tracks } */
async function readAlbumForm(event: Parameters<typeof requireAuthUserId>[0]) {
  const parts = await readMultipartFormData(event);
  if (!parts?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "multipart form is required",
    });
  }
  return validateAlbumForm(parseParts(parts));
}

/**
 * Куски multipart склеиваю в один объект.
 * Имена полей как на клиенте: name, cover, tracks[0][name], tracks[0][audio].
 */
function parseParts(parts: MultipartPart[]) {
  let name = "";
  let cover: FilePart | undefined;
  const drafts = new Map<number, TrackDraft>();

  for (const part of parts) {
    if (part.name === "name") {
      name = part.data.toString("utf8").trim();
      continue;
    }

    if (part.name === "cover" && part.filename) {
      cover = { data: part.data, type: part.type };
      continue;
    }

    const match = part.name?.match(TRACK_FIELD);
    if (!match) continue;

    const index = Number(match[1]);
    const field = match[2];
    const draft = drafts.get(index) ?? {};

    if (field === "name") draft.name = part.data.toString("utf8").trim();
    if (field === "isExplicit") {
      const raw = part.data.toString("utf8");
      draft.isExplicit = raw === "true" || raw === "1";
    }
    if (field === "audio" && part.filename) {
      draft.audio = { data: part.data, type: part.type };
    }

    drafts.set(index, draft);
  }

  const tracks = [...drafts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, draft], i) => ({
      name: draft.name ?? "",
      isExplicit: draft.isExplicit ?? false,
      audio: draft.audio,
      trackNumber: i + 1,
    }));

  return { name, cover, tracks };
}

/** Лимиты и обязательные поля. Аудио «настоящее» проверяю при чтении длительности. */
function validateAlbumForm(raw: {
  name: string;
  cover?: FilePart;
  tracks: {
    name: string;
    trackNumber: number;
    isExplicit: boolean;
    audio?: FilePart;
  }[];
}): AlbumForm {
  if (!raw.name) {
    throw createError({ statusCode: 400, statusMessage: "name is required" });
  }
  if (raw.name.length > NAME_MAX) {
    throw createError({
      statusCode: 400,
      statusMessage: `name must be at most ${NAME_MAX} characters`,
    });
  }
  if (raw.tracks.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "at least one track is required",
    });
  }
  if (raw.tracks.length > MAX_TRACKS) {
    throw createError({
      statusCode: 400,
      statusMessage: `at most ${MAX_TRACKS} tracks`,
    });
  }
  if (raw.cover && raw.cover.data.length > COVER_MAX_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: "cover must be at most 10MB",
    });
  }

  const tracks: TrackInput[] = [];
  let totalBytes = raw.cover?.data.length ?? 0;

  for (const track of raw.tracks) {
    if (!track.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "each track must have a name",
      });
    }
    if (track.name.length > NAME_MAX) {
      throw createError({
        statusCode: 400,
        statusMessage: `track name must be at most ${NAME_MAX} characters`,
      });
    }
    if (!track.audio) {
      throw createError({
        statusCode: 400,
        statusMessage: "each track must have an audio file",
      });
    }
    if (track.audio.data.length > AUDIO_MAX_BYTES) {
      throw createError({
        statusCode: 400,
        statusMessage: "audio must be at most 30MB",
      });
    }
    totalBytes += track.audio.data.length;
    tracks.push({ ...track, audio: track.audio });
  }

  if (totalBytes > TOTAL_MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "payload too large" });
  }

  return { name: raw.name, cover: raw.cover, tracks };
}

/**
 * Файлы после строк в БД. Если что-то упало — бакет и альбом (каскад треков).
 */
async function saveCoverAndTracks(
  albumId: string,
  artistId: string,
  form: AlbumForm,
) {
  const uploadedKeys: string[] = [];

  try {
    if (form.cover) {
      await putCover(albumId, form.cover, uploadedKeys);
    }
    for (const track of form.tracks) {
      await putTrack(albumId, artistId, track, uploadedKeys);
    }
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => deleteS3Object(key)));
    await prisma.album.delete({ where: { id: albumId } }).catch(() => {});
    throw error;
  }
}

/** WebP в бакет, ключ в coverSrc. Ключ в откат сразу после put. */
async function putCover(
  albumId: string,
  cover: FilePart,
  uploadedKeys: string[],
) {
  const { body, coverColor } = await processAlbumCover(cover.data);
  const key = albumCoverKey(albumId);
  await putS3Object({ key, body, contentType: "image/webp" });
  uploadedKeys.push(key);
  await prisma.album.update({
    where: { id: albumId },
    data: { coverSrc: key, coverColor },
  });
}

/** Строка трека → mp3 в бакет. Невалидное аудио отсечёт music-metadata. */
async function putTrack(
  albumId: string,
  artistId: string,
  track: TrackInput,
  uploadedKeys: string[],
) {
  const durationSec = await durationSecFromAudio(track.audio.data);
  const row = await prisma.track.create({
    data: {
      albumId,
      artistId,
      name: track.name,
      trackNumber: track.trackNumber,
      durationSec,
      isExplicit: track.isExplicit,
    },
  });

  const key = audioObjectKey(row.id);
  await putS3Object({
    key,
    body: track.audio.data,
    contentType: "audio/mpeg",
  });
  uploadedKeys.push(key);
  await prisma.track.update({
    where: { id: row.id },
    data: { audioSrc: key },
  });
}
