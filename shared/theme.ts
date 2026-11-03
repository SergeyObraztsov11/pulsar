/**
 * Theme preference cookie + blocking init script (SSR / no-flash).
 * Preference: light | dark | system. Resolved appearance is light | dark.
 */

export const THEME_COOKIE = "pulsar-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** Inline head script: resolve cookie / system before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);var p=m?decodeURIComponent(m[1]):"system";if(p!=="light"&&p!=="dark"&&p!=="system")p="system";var r=p==="light"||p==="dark"?p:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var e=document.documentElement;e.dataset.theme=r;e.style.colorScheme=r;e.classList.toggle("light",r==="light");}catch(e){}})();`;
