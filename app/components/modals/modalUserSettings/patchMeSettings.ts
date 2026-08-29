/**
 * PATCH /api/auth/me из модалок настроек.
 */
import type { FetchError } from "ofetch";
import type { MeSettingsUser } from "./types";

type PatchBody = {
  name?: string;
  bio?: string | null;
  country?: string | null;
  day?: string;
  month?: string;
  year?: string;
  gender?: string | null;
};

/** Сохранить поля профиля; при ошибке — текст для UI */
export async function patchMeSettings(body: PatchBody) {
  try {
    const user = await $fetch<MeSettingsUser>("/api/auth/me", {
      method: "PATCH",
      body,
    });
    return { ok: true as const, user };
  } catch (error) {
    const fetchError = error as FetchError;
    return {
      ok: false as const,
      message:
        fetchError?.data?.statusMessage ??
        fetchError?.statusMessage ??
        "Не удалось сохранить",
    };
  }
}
