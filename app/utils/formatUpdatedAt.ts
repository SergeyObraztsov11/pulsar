import { pluralizeRu } from "~/utils/pluralizeRu";

/** Last playlist update label for hero meta */
export function formatUpdatedAtLabel(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Обновлён сегодня";
  if (diffDays === 1) return "Обновлён вчера";
  if (diffDays < 7) {
    return `Обновлён ${diffDays} ${pluralizeRu(diffDays, "день", "дня", "дней")} назад`;
  }

  const formatted = date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

  return `Обновлён ${formatted.replace(/\.$/, "")}`;
}
