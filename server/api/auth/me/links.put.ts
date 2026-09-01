/**
 * PUT /api/auth/me/links — заменить все ссылки профиля.
 * Body: { links: [{ kind, href }] }
 */
import type { ArtistLinkKind } from "~/types/artist";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

const KINDS = new Set<ArtistLinkKind>([
  "spotify",
  "appleMusic",
  "yandexMusic",
  "instagram",
  "telegram",
  "youtube",
  "tiktok",
  "vk",
]);

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const body = await readBody<{
    links?: { kind?: string; href?: string }[];
  }>(event);

  const rawLinks = Array.isArray(body.links) ? body.links : null;
  if (!rawLinks) {
    throwApiError(400, ApiErrorCode.LINKS_REQUIRED);
  }
  if (rawLinks.length > KINDS.size) {
    throwApiError(400, ApiErrorCode.TOO_MANY_LINKS);
  }

  const normalized: { kind: ArtistLinkKind; href: string }[] = [];
  const seen = new Set<string>();

  for (const item of rawLinks) {
    const kind = (item.kind?.trim() ?? "") as ArtistLinkKind | "";
    const href = item.href?.trim() ?? "";
    if (!kind && !href) continue;
    if (!kind || !KINDS.has(kind)) {
      throwApiError(400, ApiErrorCode.INVALID_LINK_KIND, { kind });
    }
    if (seen.has(kind)) {
      throwApiError(400, ApiErrorCode.DUPLICATE_LINK_KIND, { kind });
    }
    if (!href || !isValidHttpUrl(href)) {
      throwApiError(400, ApiErrorCode.INVALID_LINK_URL);
    }
    seen.add(kind);
    normalized.push({ kind, href });
  }

  await prisma.$transaction([
    prisma.artistLink.deleteMany({ where: { userId: session.user.id } }),
    ...(normalized.length
      ? [
          prisma.artistLink.createMany({
            data: normalized.map((link, index) => ({
              userId: session.user.id,
              kind: link.kind,
              href: link.href,
              sortOrder: index,
            })),
          }),
        ]
      : []),
  ]);

  const links = await prisma.artistLink.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
    select: { kind: true, href: true },
  });

  return { links };
});
