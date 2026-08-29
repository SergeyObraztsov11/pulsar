/**
 * PUT /api/auth/me/links — заменить все ссылки профиля.
 * Body: { links: [{ kind, href }] }
 */
import type { ArtistLinkKind } from "~/types/artist";

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
    throw createError({
      statusCode: 400,
      statusMessage: "links is required",
    });
  }
  if (rawLinks.length > KINDS.size) {
    throw createError({
      statusCode: 400,
      statusMessage: "too many links",
    });
  }

  const normalized: { kind: ArtistLinkKind; href: string }[] = [];
  const seen = new Set<string>();

  for (const item of rawLinks) {
    const kind = (item.kind?.trim() ?? "") as ArtistLinkKind | "";
    const href = item.href?.trim() ?? "";
    if (!kind && !href) continue;
    if (!kind || !KINDS.has(kind)) {
      throw createError({
        statusCode: 400,
        statusMessage: `invalid link kind: ${kind}`,
      });
    }
    if (seen.has(kind)) {
      throw createError({
        statusCode: 400,
        statusMessage: `duplicate link kind: ${kind}`,
      });
    }
    if (!href || !isValidHttpUrl(href)) {
      throw createError({
        statusCode: 400,
        statusMessage: "invalid link url",
      });
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
