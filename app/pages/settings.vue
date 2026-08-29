<script setup lang="ts">
/**
 * Настройки — одна страница: слева меню-якоря, справа все секции.
 * Личные данные и аватар — модалки → API /api/auth/me*.
 */
import {
  PhCamera,
  PhLink,
  PhShieldCheck,
  PhUser,
} from "@phosphor-icons/vue";
import ModalUserSettingsAvatar, {
  type ModalUserSettingsAvatarProps,
} from "~/components/modals/modalUserSettings/ModalUserSettingsAvatar.vue";
import ModalUserSettingsBio, {
  type ModalUserSettingsBioProps,
} from "~/components/modals/modalUserSettings/ModalUserSettingsBio.vue";
import ModalUserSettingsBirthDate, {
  type ModalUserSettingsBirthDateProps,
} from "~/components/modals/modalUserSettings/ModalUserSettingsBirthDate.vue";
import ModalUserSettingsCountry, {
  type ModalUserSettingsCountryProps,
} from "~/components/modals/modalUserSettings/ModalUserSettingsCountry.vue";
import ModalUserSettingsGender, {
  type ModalUserSettingsGenderProps,
} from "~/components/modals/modalUserSettings/ModalUserSettingsGender.vue";
import ModalUserSettingsName, {
  type ModalUserSettingsNameProps,
} from "~/components/modals/modalUserSettings/ModalUserSettingsName.vue";
import type { MeSettingsUser } from "~/components/modals/modalUserSettings/types";
import type { ArtistLink, ArtistLinkKind } from "~/types/artist";

definePageMeta({
  layout: "app-layout",
});

type MeSettings = MeSettingsUser;

const LINK_SERVICES: { kind: ArtistLinkKind; label: string }[] = [
  { kind: "spotify", label: "Spotify" },
  { kind: "appleMusic", label: "Apple Music" },
  { kind: "yandexMusic", label: "Яндекс Музыка" },
  { kind: "youtube", label: "YouTube" },
  { kind: "instagram", label: "Instagram" },
  { kind: "telegram", label: "Telegram" },
  { kind: "tiktok", label: "TikTok" },
  { kind: "vk", label: "VK" },
];

const GENDER_LABELS: Record<string, string> = {
  male: "Мужской",
  female: "Женский",
  unspecified: "Не указывать",
};

const navItems = [
  { id: "personal", label: "Личные данные", icon: PhUser },
  { id: "avatar", label: "Аватар", icon: PhCamera },
  { id: "links", label: "Ссылки", icon: PhLink },
  { id: "security", label: "Безопасность", icon: PhShieldCheck },
] as const;

const activeId = ref<(typeof navItems)[number]["id"]>("personal");

const { data: me } = await useFetch<MeSettings>("/api/auth/me", {
  key: "auth-me-settings",
});

const { data: linksData } = await useFetch<{ links: ArtistLink[] }>(
  "/api/auth/me/links",
  { key: "auth-me-links" },
);

const { open: openModal } = useModal();

/** Текст или тире, если пусто */
function displayOrDash(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

/** Пол для отображения */
const genderLabel = computed(() => {
  const gender = me.value?.gender;
  if (!gender) return "—";
  return GENDER_LABELS[gender] ?? gender;
});

/** Дата рождения (UTC → локальная строка) */
const birthDateLabel = computed(() => {
  const iso = me.value?.birthDate;
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
});

/** URL по kind для строк ссылок */
const hrefByKind = computed(() => {
  const map = {} as Record<ArtistLinkKind, string>;
  for (const link of linksData.value?.links ?? []) {
    map[link.kind] = link.href;
  }
  return map;
});

/** Прокрутка к секции (скролл — контейнер app-layout) */
function onNavClick(id: (typeof navItems)[number]["id"]) {
  activeId.value = id;
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** Общий колбэк после сохранения поля */
function onPersonalSaved(user: MeSettingsUser) {
  me.value = user;
}

/** Модалка: имя */
function openNameModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsNameProps>({
    component: ModalUserSettingsName,
    props: {
      name: current.name,
      onSaved: onPersonalSaved,
    },
  });
}

/** Модалка: описание */
function openBioModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsBioProps>({
    component: ModalUserSettingsBio,
    props: {
      bio: current.bio,
      onSaved: onPersonalSaved,
    },
  });
}

/** Модалка: страна */
function openCountryModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsCountryProps>({
    component: ModalUserSettingsCountry,
    props: {
      country: current.country,
      onSaved: onPersonalSaved,
    },
  });
}

/** Модалка: дата рождения */
function openBirthDateModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsBirthDateProps>({
    component: ModalUserSettingsBirthDate,
    props: {
      birthDate: current.birthDate,
      onSaved: onPersonalSaved,
    },
  });
}

/** Модалка: пол */
function openGenderModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsGenderProps>({
    component: ModalUserSettingsGender,
    props: {
      gender: current.gender,
      onSaved: onPersonalSaved,
    },
  });
}

/** Модалка: аватар */
function openAvatarModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsAvatarProps>({
    component: ModalUserSettingsAvatar,
    props: {
      avatarSrc: current.avatarSrc,
      name: current.name,
      onSaved: onPersonalSaved,
    },
  });
}
</script>

<template>
  <div class="flex flex-col gap-8 animate-fade-up motion-reduce:animate-none">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold text-primary-white">Настройки</h1>
      <p class="text-sm text-primary-gray">Профиль и аккаунт</p>
    </div>

    <div
      class="flex flex-col gap-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-10"
    >
      <!-- Меню: mobile — ряд, desktop — колонка -->
      <nav
        class="flex flex-row gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:overflow-visible"
        aria-label="Разделы настроек"
      >
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-lg p-2 text-left leading-none text-primary-white outline-none transition-colors hover:bg-primary-gray-dark focus-visible:bg-primary-gray-dark"
          :class="activeId === item.id ? 'bg-primary-gray-dark' : null"
          @click="onNavClick(item.id)"
        >
          <component
            :is="item.icon"
            class="shrink-0"
            :size="20"
            weight="light"
          />
          <span class="whitespace-nowrap leading-normal">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Единая страница секций -->
      <div class="flex min-w-0 max-w-2xl flex-col gap-10">
        <!-- Личные данные -->
        <section id="personal" class="flex scroll-mt-24 flex-col gap-6">
          <h2 class="text-xl font-bold text-primary-white">Личные данные</h2>

          <div class="flex flex-col">
            <div
              class="flex flex-row items-center justify-between gap-4 border-b border-primary-gray-dark py-4"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Имя *</p>
                <p class="truncate text-base text-primary-white">
                  {{ displayOrDash(me?.name) }}
                </p>
              </div>
              <UiButton
                variant="gray"
                text="Изменить"
                type="button"
                @click="openNameModal"
              />
            </div>

            <div
              class="flex flex-row items-center justify-between gap-4 border-b border-primary-gray-dark py-4"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Описание</p>
                <p class="line-clamp-2 text-base text-primary-white">
                  {{ displayOrDash(me?.bio) }}
                </p>
              </div>
              <UiButton
                variant="gray"
                text="Изменить"
                type="button"
                @click="openBioModal"
              />
            </div>

            <div
              class="flex flex-row items-center justify-between gap-4 border-b border-primary-gray-dark py-4"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Страна</p>
                <p class="truncate text-base text-primary-white">
                  {{ displayOrDash(me?.country) }}
                </p>
              </div>
              <UiButton
                variant="gray"
                text="Изменить"
                type="button"
                @click="openCountryModal"
              />
            </div>

            <div
              class="flex flex-row items-center justify-between gap-4 border-b border-primary-gray-dark py-4"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Дата рождения *</p>
                <p class="truncate text-base text-primary-white">
                  {{ birthDateLabel }}
                </p>
              </div>
              <UiButton
                variant="gray"
                text="Изменить"
                type="button"
                @click="openBirthDateModal"
              />
            </div>

            <div class="flex flex-row items-center justify-between gap-4 py-4">
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Пол *</p>
                <p class="truncate text-base text-primary-white">
                  {{ genderLabel }}
                </p>
              </div>
              <UiButton
                variant="gray"
                text="Изменить"
                type="button"
                @click="openGenderModal"
              />
            </div>
          </div>
        </section>

        <!-- Аватар -->
        <section id="avatar" class="flex scroll-mt-24 flex-col gap-6">
          <h2 class="text-xl font-bold text-primary-white">Аватар</h2>

          <div
            class="flex flex-row items-center justify-between gap-4 border-b border-primary-gray-dark py-4"
          >
            <div class="flex min-w-0 flex-row items-center gap-4">
              <div
                class="relative size-16 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
              >
                <UiCoverImage
                  :src="me?.avatarSrc"
                  :icon="PhUser"
                  :alt="me?.name"
                  :icon-size="28"
                />
              </div>
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Фото профиля</p>
                <p class="text-base text-primary-white">
                  {{ me?.avatarSrc ? "Загружено" : "Не выбрано" }}
                </p>
              </div>
            </div>
            <UiButton
              variant="gray"
              text="Изменить"
              type="button"
              @click="openAvatarModal"
            />
          </div>
        </section>

        <!-- Ссылки -->
        <section id="links" class="flex scroll-mt-24 flex-col gap-6">
          <h2 class="text-xl font-bold text-primary-white">Ссылки</h2>

          <div class="flex flex-col">
            <div
              v-for="(service, index) in LINK_SERVICES"
              :key="service.kind"
              class="flex flex-row items-center justify-between gap-4 py-4"
              :class="
                index < LINK_SERVICES.length - 1
                  ? 'border-b border-primary-gray-dark'
                  : null
              "
            >
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">{{ service.label }}</p>
                <p class="truncate text-base text-primary-white">
                  {{ displayOrDash(hrefByKind[service.kind]) }}
                </p>
              </div>
              <UiButton variant="gray" text="Изменить" type="button" disabled />
            </div>
          </div>
        </section>

        <!-- Безопасность -->
        <section id="security" class="flex scroll-mt-24 flex-col gap-6">
          <h2 class="text-xl font-bold text-primary-white">Безопасность</h2>

          <div class="flex flex-col">
            <div
              class="flex flex-row items-center justify-between gap-4 border-b border-primary-gray-dark py-4"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Email *</p>
                <p class="truncate text-base text-primary-white">
                  {{ displayOrDash(me?.email) }}
                </p>
              </div>
              <UiButton variant="gray" text="Изменить" type="button" disabled />
            </div>

            <div
              class="flex flex-row items-center justify-between gap-4 border-b border-primary-gray-dark py-4"
            >
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-sm text-primary-gray">Пароль *</p>
                <p class="text-base text-primary-white">••••••••</p>
              </div>
              <UiButton variant="gray" text="Изменить" type="button" disabled />
            </div>

            <div class="flex flex-row items-center justify-between gap-4 py-4">
              <div class="flex min-w-0 flex-col gap-1">
                <p class="text-base text-danger">Выйти из аккаунта</p>
              </div>
              <NuxtLink to="/logout" class="text-danger">Выйти</NuxtLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
