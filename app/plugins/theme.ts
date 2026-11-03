/**
 * Theme: seed shared system appearance before useTheme watch, then bind head.
 * Client keeps matchMedia → useState in sync so all useTheme() callers update.
 *
 * SSR + system: payload defaults to dark; blocking script paints the real OS
 * theme before first paint; this plugin aligns useState on client before mount
 * so resolved / toggle / icons match without wiping the script’s class.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    syncSystemThemeFromMedia();
  }

  useTheme({ bindHead: true });
});
