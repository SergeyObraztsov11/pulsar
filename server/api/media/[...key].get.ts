/**
 * GET /api/media/<ключ> — объект из MinIO.
 * Range на audio: 206, иначе <audio> при seek начинает трек сначала.
 */
const ALLOWED_PREFIXES = ["covers/", "avatars/", "audio/"];

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp3: "audio/mpeg",
};

function contentTypeByKey(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, "key", { decode: true });
  const key = raw?.replace(/^\/+/, "") ?? "";

  const isAllowed =
    key.length > 0 &&
    !key.includes("..") &&
    ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));

  if (!isAllowed) {
    throw createError({ statusCode: 400, statusMessage: "Invalid media key" });
  }

  const rangeHeader = getHeader(event, "range");
  const object = await getS3Object(key, rangeHeader).catch(() => null);
  if (!object?.Body) {
    throw createError({
      statusCode: rangeHeader ? 416 : 404,
      statusMessage: rangeHeader ? "Range Not Satisfiable" : "Media not found",
    });
  }

  setResponseHeaders(event, {
    "content-type": object.ContentType ?? contentTypeByKey(key),
    "cache-control": "public, max-age=3600",
    "accept-ranges": "bytes",
  });
  if (object.ETag) {
    setResponseHeader(event, "etag", object.ETag);
  }
  if (object.ContentRange) {
    setResponseStatus(event, 206);
    setResponseHeader(event, "content-range", object.ContentRange);
  }
  if (object.ContentLength != null) {
    setResponseHeader(event, "content-length", object.ContentLength);
  }

  return object.Body.transformToWebStream();
});
