/**
 * Общая модель пункта меню для MenuFloating / MenuSheet / MenuResponsive.
 */
import type { Component } from "vue";

/** Пункт меню (и вложенные children) */
export type MenuItem = {
  /** Уникальный id пункта */
  id: string;
  /** Текст пункта */
  label: string;
  /** Иконка Phosphor (опционально) */
  icon?: Component;
  /** Вес иконки */
  iconWeight?: "light" | "fill";
  /** Доп. классы иконки (например accent при like) */
  iconClass?: string;
  /** Доп. классы текста */
  labelClass?: string;
  /** Вложенный уровень: sheet — drill-down, desktop — flyout */
  children?: MenuItem[];
  /** Колбэк по клику на лист (без children) */
  onClick?: () => void;
};

/** Id служебного пункта «Назад» в MenuSheet */
export const MENU_SHEET_BACK_ID = "__back";

/** Классы панели floating (корень + flyout) — как suggest поиска */
export const MENU_FLOATING_PANEL_CLASS =
  "z-60 w-max rounded-xl border border-primary-gray-dark bg-primary-gray-dark p-1 text-sm text-primary-white";
