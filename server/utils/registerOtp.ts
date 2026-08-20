/**
 * OTP регистрации: генерация, дата рождения, пол.
 */
import { randomInt } from "node:crypto";

export const REGISTER_OTP_LENGTH = 4;
export const REGISTER_OTP_TTL_MS = 10 * 60 * 1000;
export const REGISTER_OTP_MAX_ATTEMPTS = 5;
export const REGISTER_OTP_RESEND_MS = 60 * 1000;

const GENDERS = new Set(["male", "female", "unspecified"]);

/** Четырёхзначный код, включая ведущие нули */
export function generateRegisterOtp() {
  return randomInt(0, 10 ** REGISTER_OTP_LENGTH)
    .toString()
    .padStart(REGISTER_OTP_LENGTH, "0");
}

/** Календарная дата из день / месяц / год или null */
export function parseBirthDate(day: string, month: string, year: string) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
    return null;
  }
  if (y < 1900 || y > new Date().getUTCFullYear()) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Допустимое значение пола */
export function isGender(value: string) {
  return GENDERS.has(value);
}
