/**
 * S3 / MinIO: put, delete, signed GET. Ключи — не URL в публичной папке.
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

/** Настройки из runtimeConfig; без ключей — ошибка */
function getS3Config() {
  const { s3 } = useRuntimeConfig();
  if (!s3.accessKey || !s3.secretKey || !s3.bucket || !s3.endpoint) {
    throw new Error("S3 config is incomplete (NUXT_S3_*)");
  }
  return s3;
}

/** Singleton S3-клиент (path-style — для MinIO) */
export function getS3Client() {
  if (client) return client;
  const s3 = getS3Config();
  client = new S3Client({
    region: s3.region || "us-east-1",
    endpoint: s3.endpoint,
    credentials: {
      accessKeyId: s3.accessKey,
      secretAccessKey: s3.secretKey,
    },
    forcePathStyle: true,
  });
  return client;
}

export {
  albumCoverKey,
  audioObjectKey,
  avatarObjectKey,
  playlistCoverKey,
} from "~/utils/mediaKeys";

/** Загрузить объект */
export async function putS3Object(opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}) {
  const s3 = getS3Config();
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
    }),
  );
}

/** Удалить объект */
export async function deleteS3Object(key: string) {
  const s3 = getS3Config();
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: s3.bucket,
      Key: key,
    }),
  );
}

/** Объект из бакета: поток тела + метаданные; range — заголовок bytes= */
export async function getS3Object(key: string, range?: string) {
  const s3 = getS3Config();
  return getS3Client().send(
    new GetObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      Range: range,
    }),
  );
}

/** Временный GET URL (по умолчанию 1 час) */
export async function getS3SignedGetUrl(key: string, expiresIn = 3600) {
  const s3 = getS3Config();
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: s3.bucket,
      Key: key,
    }),
    { expiresIn },
  );
}
