import { ApiErrorCode, throwApiError } from "../../utils/apiError";

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
      avatarColor: true,
      bio: true,
      country: true,
      birthDate: true,
      gender: true,
    },
  });

  if (!user) {
    await clearUserSession(event);
    throwApiError(401, ApiErrorCode.USER_NOT_FOUND);
  }

  return user;
});
