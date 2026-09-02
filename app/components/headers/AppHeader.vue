<script setup lang="ts">
/**
 * AppHeader — desktop chrome: лого · поиск · аватар.
 * Расположение и фон полосы — в AppLayout (tone-shell).
 */
import { PhGear, PhSignOut, PhUser } from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const { user } = useUserSession();
const menuOpen = ref(false);

const profileTo = computed(() =>
  user.value?.id ? `/user/${user.value.id}` : "/settings",
);

const menuItems = computed<MenuItem[]>(() => [
  {
    id: "profile",
    label: "Профиль",
    icon: PhUser,
    onClick: () => navigateTo(profileTo.value),
  },
  {
    id: "settings",
    label: "Настройки",
    icon: PhGear,
    onClick: () => navigateTo("/settings"),
  },
  {
    id: "logout",
    label: "Выйти",
    icon: PhSignOut,
    onClick: () => navigateTo("/logout"),
  },
]);
</script>

<template>
  <header
    class="hidden h-16 w-full shrink-0 px-2 lg:grid lg:grid-cols-[1fr_minmax(0,999fr)_1fr] lg:items-center lg:px-6"
  >
    <!-- Лого -->
    <div class="flex min-w-0 items-center justify-start">
      <AppLogo to="/home" size="sm" />
    </div>

    <!-- Поиск — широкая центральная колонка -->
    <div class="flex min-w-0 items-center justify-center px-4">
      <SearchField class="w-full max-w-xl" />
    </div>

    <!-- Аватар -->
    <div class="flex min-w-0 items-center justify-end">
      <MenuResponsive v-model:open="menuOpen" :items="menuItems">
        <template #trigger>
          <button
            type="button"
            class="relative size-10 shrink-0 overflow-hidden rounded-full transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-tone-white/50"
            :aria-label="user?.name ?? 'Меню профиля'"
            :aria-expanded="menuOpen"
          >
            <UiCoverImage
              :src="user?.avatarSrc"
              :icon="PhUser"
              :icon-size="50"
            />
          </button>
        </template>
      </MenuResponsive>
    </div>
  </header>
</template>
