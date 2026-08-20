/**
 * GET /api/auth/me — текущий пользователь (публичные поля + email).
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarSrc: true,
      bio: true,
    },
  });

  if (!user) {
    await clearUserSession(event);
    throw createError({ statusCode: 401, statusMessage: "User not found" });
  }

  return user;
});
