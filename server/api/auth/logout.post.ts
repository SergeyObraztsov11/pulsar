/**
 * POST /api/auth/logout — очистить сессию.
 */
export default defineEventHandler(async (event) => {
  await clearUserSession(event);
  return { ok: true };
});
