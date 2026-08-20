/**
 * POST /api/auth/register — больше не создаёт аккаунт без кода.
 * Используйте /api/auth/register/send-code и /verify.
 */
export default defineEventHandler(() => {
  throw createError({
    statusCode: 400,
    statusMessage: "Подтвердите email кодом из письма.",
  });
});
