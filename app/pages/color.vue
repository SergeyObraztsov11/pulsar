<script setup lang="ts">
/**
 * Тестовая палитра — legacy primary-* и новая tone-* из @theme (main.css).
 */
definePageMeta({
  layout: "app-layout",
});

type Swatch = {
  token: string;
  hex: string;
  bg: string;
  label: string;
  role?: string;
};

/** Legacy — текущий UI, не удалять до миграции */
const legacyPalette: Swatch[] = [
  {
    token: "primary-white",
    hex: "#ffffff",
    bg: "bg-primary-white",
    label: "text-primary-black",
    role: "текст / white CTA",
  },
  {
    token: "primary-gray-light",
    hex: "#6a6a6a",
    bg: "bg-primary-gray-light",
    label: "text-primary-white",
    role: "legacy (имя ≠ яркость)",
  },
  {
    token: "primary-gray",
    hex: "#2e2d2d",
    bg: "bg-primary-gray",
    label: "text-primary-white",
    role: "legacy muted / surface",
  },
  {
    token: "primary-gray-dark",
    hex: "#1a1a1a",
    bg: "bg-primary-gray-dark",
    label: "text-primary-white",
    role: "карточки, player, меню",
  },
  {
    token: "primary-black",
    hex: "#111111",
    bg: "bg-primary-black",
    label: "text-primary-white",
    role: "фон main / layout",
  },
  {
    token: "danger",
    hex: "#f25f5f",
    bg: "bg-danger",
    label: "text-primary-white",
    role: "ошибки форм",
  },
];

/** v2 — tone-*; ошибки через общий danger */
const tonePalette: Swatch[] = [
  {
    token: "tone-white",
    hex: "#ffffff",
    bg: "bg-tone-white",
    label: "text-tone-canvas",
    role: "primary текст, white CTA",
  },
  {
    token: "tone-muted",
    hex: "#a7a7a7",
    bg: "bg-tone-muted",
    label: "text-tone-canvas",
    role: "secondary текст",
  },
  {
    token: "tone-surface",
    hex: "#282828",
    bg: "bg-tone-surface",
    label: "text-tone-white",
    role: "hover строк, покой gray-кнопки, панель меню",
  },
  {
    token: "tone-surface-hover",
    hex: "#3a3a3a",
    bg: "bg-tone-surface-hover",
    label: "text-tone-white",
    role: "hover gray-кнопки и пунктов меню",
  },
  {
    token: "tone-canvas",
    hex: "#121212",
    bg: "bg-tone-canvas",
    label: "text-tone-white",
    role: "фон main",
  },
  {
    token: "tone-shell",
    hex: "#000000",
    bg: "bg-tone-shell",
    label: "text-tone-white",
    role: "внешний chrome",
  },
];

const toneElevation = [
  "bg-tone-shell",
  "bg-tone-canvas",
  "bg-tone-surface",
  "bg-tone-surface-hover",
] as const;
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-12 p-6">
    <header>
      <h1 class="text-2xl font-bold text-primary-white">Color tokens</h1>
      <p class="mt-1 text-sm text-primary-gray">
        Источник:
        <span class="text-primary-white">app/assets/css/main.css</span> (@theme)
      </p>
    </header>

    <!-- Legacy -->
    <section>
      <h2 class="text-xl font-bold text-primary-white">Legacy — primary-*</h2>
      <p class="mt-1 text-sm text-primary-gray">
        Текущий UI. Не удалять, пока не мигрируем компоненты.
      </p>

      <ul class="mt-6 grid gap-4 sm:grid-cols-2">
        <li
          v-for="item in legacyPalette"
          :key="item.token"
          class="overflow-hidden rounded-lg border border-primary-gray-dark"
        >
          <div class="flex h-28 items-end p-4" :class="[item.bg, item.label]">
            <span class="text-sm font-medium leading-none">{{ item.token }}</span>
          </div>
          <div class="bg-primary-gray-dark px-4 py-3">
            <p class="text-sm text-primary-white">{{ item.hex }}</p>
            <p class="mt-1 font-mono text-xs text-primary-gray">{{ item.bg }}</p>
            <p v-if="item.role" class="mt-1 text-xs text-primary-gray">
              {{ item.role }}
            </p>
          </div>
        </li>
      </ul>
    </section>

    <!-- v2 -->
    <section>
      <h2 class="text-xl font-bold text-primary-white">v2 — tone-*</h2>
      <p class="mt-1 text-sm text-primary-gray">
        5 токенов + surface-hover. Ошибки — общий <span class="text-primary-white">danger</span>.
      </p>

      <!-- Полоска elevation -->
      <div
        class="mt-6 overflow-hidden rounded-lg border border-primary-gray-dark"
      >
        <p class="bg-primary-gray-dark px-4 py-2 text-xs text-primary-gray">
          Elevation (shell → canvas → surface)
        </p>
        <div class="flex h-16">
          <div
            v-for="step in toneElevation"
            :key="step"
            class="flex flex-1 items-end justify-center pb-2"
            :class="step"
          >
            <span class="font-mono text-[10px] text-tone-muted">{{
              step.replace("bg-", "")
            }}</span>
          </div>
        </div>
      </div>

      <ul class="mt-6 grid gap-4 sm:grid-cols-2">
        <li
          v-for="item in tonePalette"
          :key="item.token"
          class="overflow-hidden rounded-lg border border-primary-gray-dark"
        >
          <div class="flex h-28 items-end p-4" :class="[item.bg, item.label]">
            <span class="text-sm font-medium leading-none">{{ item.token }}</span>
          </div>
          <div class="bg-primary-gray-dark px-4 py-3">
            <p class="text-sm text-primary-white">{{ item.hex }}</p>
            <p class="mt-1 font-mono text-xs text-primary-gray">{{ item.bg }}</p>
            <p v-if="item.role" class="mt-1 text-xs text-primary-gray">
              {{ item.role }}
            </p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
