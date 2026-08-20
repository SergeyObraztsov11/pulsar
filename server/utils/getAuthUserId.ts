import type { H3Event } from "h3";

/**
 * Id текущего пользователя (кладёт middleware из сессии nuxt-auth-utils).
 */
export function getAuthUserId(event: H3Event): string | null {
  return event.context.userId ?? null;
}

/** Id пользователя или 401 */
export function requireAuthUserId(event: H3Event): string {
  const userId = getAuthUserId(event);
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }
  return userId;
}
