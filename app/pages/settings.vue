<script setup lang="ts">
/**
 * Настройки — утилитарная страница: профиль-карточка, табы, панели секций.
 * Личные данные и аватар — модалки → API /api/auth/me*.
 */
import { PhCaretRight, PhUser } from "@phosphor-icons/vue";
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
type NavId = "personal" | "links" | "security";

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

const navItems: { id: NavId; label: string }[] = [
  { id: "personal", label: "Профиль" },
  { id: "links", label: "Ссылки" },
  { id: "security", label: "Безопасность" },
];

const activeId = ref<NavId>("personal");

const { data: me } = await useFetch<MeSettings>("/api/auth/me", {
  key: "auth-me-settings",
});

const { data: linksData } = await useFetch<{ links: ArtistLink[] }>(
  "/api/auth/me/links",
  { key: "auth-me-links" },
);

const { open: openModal } = useModal();

const profileTo = computed(() =>
  me.value?.id ? `/user/${me.value.id}` : "/",
);

/** Текст или тире, если пусто */
function displayOrDash(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

const genderLabel = computed(() => {
  const gender = me.value?.gender;
  if (!gender) return "—";
  return GENDER_LABELS[gender] ?? gender;
});

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

const hrefByKind = computed(() => {
  const map = {} as Record<ArtistLinkKind, string>;
  for (const link of linksData.value?.links ?? []) {
    map[link.kind] = link.href;
  }
  return map;
});

/** Прокрутка к секции */
function onNavClick(id: NavId) {
  activeId.value = id;
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function onPersonalSaved(user: MeSettingsUser) {
  me.value = user;
}

function openNameModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsNameProps>({
    component: ModalUserSettingsName,
    props: { name: current.name, onSaved: onPersonalSaved },
  });
}

function openBioModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsBioProps>({
    component: ModalUserSettingsBio,
    props: { bio: current.bio, onSaved: onPersonalSaved },
  });
}

function openCountryModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsCountryProps>({
    component: ModalUserSettingsCountry,
    props: { country: current.country, onSaved: onPersonalSaved },
  });
}

function openBirthDateModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsBirthDateProps>({
    component: ModalUserSettingsBirthDate,
    props: { birthDate: current.birthDate, onSaved: onPersonalSaved },
  });
}

function openGenderModal() {
  const current = me.value;
  if (!current) return;
  openModal<ModalUserSettingsGenderProps>({
    component: ModalUserSettingsGender,
    props: { gender: current.gender, onSaved: onPersonalSaved },
  });
}

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
  <div
    class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 animate-fade-up motion-reduce:animate-none lg:p-6"
  >
    <!-- Карточка профиля -->
    <section class="flex items-center gap-4 rounded-lg bg-tone-surface p-4">
      <div class="size-16 shrink-0 overflow-hidden rounded-full bg-tone-shell">
        <UiCoverImage
          :src="me?.avatarSrc"
          :icon="PhUser"
          :alt="me?.name"
          :icon-size="28"
        />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-2xl font-bold text-tone-white">
          {{ me?.name ?? "…" }}
        </p>
        <NuxtLink
          :to="profileTo"
          class="mt-1 inline-block text-sm text-tone-muted transition-colors hover:text-tone-white"
        >
          Открыть профиль
        </NuxtLink>
      </div>

      <UiButton
        variant="white"
        icon="UploadSimple"
        text="Фото"
        type="button"
        @click="openAvatarModal"
      />
    </section>

    <!-- Табы -->
    <nav
      class="flex gap-1 border-b border-tone-surface"
      aria-label="Разделы настроек"
    >
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        class="-mb-px border-b-2 px-3 pb-3 text-sm font-medium leading-none transition-colors"
        :class="
          activeId === item.id
            ? 'border-tone-white text-tone-white'
            : 'border-transparent text-tone-muted hover:text-tone-white'
        "
        @click="onNavClick(item.id)"
      >
        {{ item.label }}
      </button>
    </nav>

    <div class="flex flex-col gap-6">
      <!-- Профиль -->
      <section
        id="personal"
        class="scroll-mt-24 overflow-hidden rounded-lg bg-tone-surface"
      >
        <h2
          class="border-b border-tone-surface-hover px-4 py-3 text-lg font-bold text-tone-white"
        >
          Личные данные
        </h2>

        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-tone-surface-hover"
          @click="openNameModal"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-tone-muted">Имя</span>
            <span class="block truncate text-base font-medium text-tone-white">
              {{ displayOrDash(me?.name) }}
            </span>
          </span>
          <PhCaretRight
            :size="18"
            weight="bold"
            class="shrink-0 text-tone-muted"
          />
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-tone-surface-hover"
          @click="openBioModal"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-tone-muted">Описание</span>
            <span
              class="block line-clamp-2 text-base font-medium text-tone-white"
            >
              {{ displayOrDash(me?.bio) }}
            </span>
          </span>
          <PhCaretRight
            :size="18"
            weight="bold"
            class="shrink-0 text-tone-muted"
          />
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-tone-surface-hover"
          @click="openCountryModal"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-tone-muted">Страна</span>
            <span class="block truncate text-base font-medium text-tone-white">
              {{ displayOrDash(me?.country) }}
            </span>
          </span>
          <PhCaretRight
            :size="18"
            weight="bold"
            class="shrink-0 text-tone-muted"
          />
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-tone-surface-hover"
          @click="openBirthDateModal"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-tone-muted">Дата рождения</span>
            <span class="block truncate text-base font-medium text-tone-white">
              {{ birthDateLabel }}
            </span>
          </span>
          <PhCaretRight
            :size="18"
            weight="bold"
            class="shrink-0 text-tone-muted"
          />
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-tone-surface-hover"
          @click="openGenderModal"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-tone-muted">Пол</span>
            <span class="block truncate text-base font-medium text-tone-white">
              {{ genderLabel }}
            </span>
          </span>
          <PhCaretRight
            :size="18"
            weight="bold"
            class="shrink-0 text-tone-muted"
          />
        </button>
      </section>

      <!-- Ссылки -->
      <section
        id="links"
        class="scroll-mt-24 overflow-hidden rounded-lg bg-tone-surface"
      >
        <div class="border-b border-tone-surface-hover px-4 py-3">
          <h2 class="text-lg font-bold text-tone-white">Ссылки</h2>
          <p class="mt-1 text-sm text-tone-muted">
            Скоро можно будет привязать соцсети и площадки
          </p>
        </div>

        <div
          v-for="service in LINK_SERVICES"
          :key="service.kind"
          class="px-4 py-3 opacity-50"
        >
          <p class="text-sm text-tone-muted">{{ service.label }}</p>
          <p class="truncate text-base font-medium text-tone-white">
            {{ displayOrDash(hrefByKind[service.kind]) }}
          </p>
        </div>
      </section>

      <!-- Безопасность -->
      <section
        id="security"
        class="scroll-mt-24 overflow-hidden rounded-lg bg-tone-surface"
      >
        <h2
          class="border-b border-tone-surface-hover px-4 py-3 text-lg font-bold text-tone-white"
        >
          Безопасность
        </h2>

        <div class="px-4 py-3 opacity-50">
          <p class="text-sm text-tone-muted">Email</p>
          <p class="truncate text-base font-medium text-tone-white">
            {{ displayOrDash(me?.email) }}
          </p>
        </div>

        <div class="px-4 py-3 opacity-50">
          <p class="text-sm text-tone-muted">Пароль</p>
          <p class="text-base font-medium text-tone-white">••••••••</p>
        </div>

        <NuxtLink
          to="/logout"
          class="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-tone-surface-hover"
        >
          <span class="min-w-0 flex-1 text-base font-medium text-danger">
            Выйти из аккаунта
          </span>
          <PhCaretRight
            :size="18"
            weight="bold"
            class="shrink-0 text-danger"
          />
        </NuxtLink>
      </section>
    </div>
  </div>
</template>
