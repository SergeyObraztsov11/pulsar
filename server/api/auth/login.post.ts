/**
 * POST /api/auth/login — вход и сессия.
 * Body: { email, password }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event);

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "email and password are required",
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  // Старый формат хеша (сид) → перехешируем на формат nuxt-auth-utils
  if (passwordNeedsReHash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarSrc: user.avatarSrc,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarSrc: user.avatarSrc,
    bio: user.bio,
  };
});
