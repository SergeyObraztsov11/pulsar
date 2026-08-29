/**
 * GET /api/auth/me/links — ссылки текущего пользователя.
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const links = await prisma.artistLink.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
    select: { kind: true, href: true },
  });

  return { links };
});
