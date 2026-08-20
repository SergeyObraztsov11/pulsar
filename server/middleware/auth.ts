/**
 * Кладёт userId из сессии в event.context (для getAuthUserId).
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (session.user?.id) {
    event.context.userId = session.user.id;
  }
});
