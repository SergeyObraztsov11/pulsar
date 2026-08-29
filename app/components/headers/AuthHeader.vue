<script setup lang="ts">
/**
 * AuthHeader — лого слева | ghost-nav (иконка+текст) + аватар справа.
 */
import {
  PhChartBar,
  PhGear,
  PhHeart,
  PhHouse,
  PhListHeart,
  PhMagnifyingGlass,
  PhSignOut,
  PhUploadSimple,
  PhUser,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const route = useRoute();
const { user } = useUserSession();
const menuOpen = ref(false);

type NavItem = {
  to: string;
  label: string;
  icon?: typeof PhHouse;
};

const navItems: NavItem[] = [
  { to: "/home", label: "Главная" },
  { to: "/search", label: "Поиск", icon: PhMagnifyingGlass },
  { to: "/likes", label: "Коллекция" },
  { to: "/popular", label: "Популярное" },
];

function isNavActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`);
}

const menuItems = computed<MenuItem[]>(() => {
  const userId = user.value?.id;
  return [
    {
      id: "profile",
      label: "Profile",
      icon: PhUser,
      onClick: () => navigateTo(userId ? `/user/${userId}` : "/settings"),
    },
    {
      id: "likes",
      label: "Liked",
      icon: PhHeart,
      onClick: () => navigateTo("/likes"),
    },
    {
      id: "upload",
      label: "Upload",
      icon: PhUploadSimple,
      onClick: () => navigateTo("/upload"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: PhGear,
      onClick: () => navigateTo("/settings"),
    },
    {
      id: "logout",
      label: "Log out",
      icon: PhSignOut,
      onClick: () => navigateTo("/logout"),
    },
  ];
});
</script>

<template>
  <HeaderLayout>
    <div class="flex h-full w-full items-center justify-between gap-4">
      <AppLogo to="/home" />

      <div class="flex shrink-0 items-center gap-6">
        <nav
          class="hidden items-center gap-6 lg:flex"
          aria-label="Основная навигация"
        >
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="inline-flex items-center gap-2 rounded-full text-sm font-medium leading-none transition-colors text-primary-white hover:text-primary-white/50"
            :class="
              isNavActive(item.to)
                ? 'underline underline-offset-4'
                : ''
            "
          >
            <component
              v-if="item?.icon"
              :is="item.icon"
              :size="14"
              weight="light"
              class="shrink-0"
            />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <MenuResponsive v-model:open="menuOpen" :items="menuItems">
          <template #trigger>
            <button
              type="button"
              class="relative inline-flex size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-primary-white"
              :aria-label="user?.name ?? 'Profile'"
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
    </div>
  </HeaderLayout>
</template>
