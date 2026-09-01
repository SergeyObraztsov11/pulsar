/**
 * formatListenersLabel — подпись «слушатели» для профиля артиста и модалки «О артисте».
 * Склеивает formatCompactCount + склонение: «Нет слушателей», «1,2 млн слушателей».
 */
import { formatCompactCount } from "~/utils/formatCompactCount";
import { pluralizeRu } from "~/utils/pluralizeRu";

export function formatListenersLabel(
  count: number | null | undefined,
): string | null {
  if (count == null) return null;
  if (count <= 0) return "Нет слушателей";

  const formatted = formatCompactCount(count);
  const suffix = pluralizeRu(
    count,
    "слушатель",
    "слушателя",
    "слушателей",
  );
  return `${formatted} ${suffix}`;
}
