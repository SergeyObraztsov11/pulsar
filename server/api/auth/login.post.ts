import { ApiErrorCode, throwApiError } from "../../utils/apiError";

/**
 * POST /api/auth/login — вход и сессия.
 * Body: { email, password }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event);

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    throwApiError(400, ApiErrorCode.EMAIL_PASSWORD_REQUIRED);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throwApiError(401, ApiErrorCode.INVALID_CREDENTIALS);
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throwApiError(401, ApiErrorCode.INVALID_CREDENTIALS);
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
