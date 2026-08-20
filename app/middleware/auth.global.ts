/**
 * Доступ к страницам по сессии.
 * Гость: /, /login, /register, /forgot-password, /logout.
 * Залогиненный с /, /login, /register, /forgot-password → /home.
 * /onboarding — только после входа (скелет выбора вкусов).
 */
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();
  const path = to.path;

  const publicPaths = new Set([
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/logout",
  ]);
  const guestOnlyPaths = new Set([
    "/",
    "/login",
    "/register",
    "/forgot-password",
  ]);

  // Уже вошёл — лендинг и формы auth не нужны
  if (loggedIn.value && guestOnlyPaths.has(path)) {
    return navigateTo("/home");
  }

  // Не вошёл — только публичные; несуществующий URL → 404
  if (!loggedIn.value && !publicPaths.has(path)) {
    if (to.matched.length === 0) return;
    return navigateTo("/login");
  }
});
