/**
 * Theme preference (cookie) + resolved light/dark on <html>.
 * Default preference is system; OS scheme is shared reactive state for all callers.
 */
import {
  THEME_COOKIE,
  isThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "#shared/theme";

const SYSTEM_THEME_KEY = "pulsar-system-theme";

function readSystemTheme(): ResolvedTheme {
  if (!import.meta.client) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyDom(resolved: ResolvedTheme) {
  if (!import.meta.client) return;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  root.classList.toggle("light", resolved === "light");
}

/** Shared OS appearance; plugin keeps it in sync with matchMedia. */
export function useSystemThemeState() {
  return useState<ResolvedTheme>(SYSTEM_THEME_KEY, () => "dark");
}

/** Call once on client (plugin): seed from mq and subscribe to changes. */
export function syncSystemThemeFromMedia() {
  const systemTheme = useSystemThemeState();
  systemTheme.value = readSystemTheme();

  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onChange = () => {
    systemTheme.value = mq.matches ? "light" : "dark";
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useTheme(options?: { bindHead?: boolean }) {
  const preference = useCookie<ThemePreference>(THEME_COOKIE, {
    default: () => "system",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
    watch: true,
  });

  if (!isThemePreference(preference.value)) {
    preference.value = "system";
  }

  const systemTheme = useSystemThemeState();

  const resolved = computed<ResolvedTheme>(() => {
    const pref = preference.value;
    if (pref === "light" || pref === "dark") return pref;
    return systemTheme.value;
  });

  function setPreference(next: ThemePreference) {
    preference.value = next;
  }

  /** Toggle explicit light ↔ dark from the current resolved appearance. */
  function toggle() {
    setPreference(resolved.value === "light" ? "dark" : "light");
  }

  // Head once from plugin (SSR + client); other callers only share state.
  if (options?.bindHead) {
    useHead({
      htmlAttrs: {
        class: computed(() =>
          resolved.value === "light" ? "light" : undefined,
        ),
        style: computed(() => `color-scheme: ${resolved.value}`),
        "data-theme": resolved,
      },
    });
  }

  if (import.meta.client) {
    watch(
      resolved,
      (value) => {
        applyDom(value);
      },
      { immediate: true },
    );
  }

  return {
    preference,
    resolved,
    systemTheme,
    setPreference,
    toggle,
  };
}
