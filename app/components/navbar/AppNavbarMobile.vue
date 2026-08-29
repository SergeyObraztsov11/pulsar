<script setup lang="ts">
/**
 * AppNavbarMobile — нижняя навигация (h-14).
 * Активный пункт — white; в покое — gray.
 */
import {
  PhHouse,
  PhMagnifyingGlass,
  PhUser,
  PhListHeart,
} from "@phosphor-icons/vue";

const route = useRoute();

const navItems = [
  { to: "/home", label: "Главная", icon: PhHouse },
  { to: "/search", label: "Поиск", icon: PhMagnifyingGlass },
  { to: "/likes", label: "Лайки", icon: PhListHeart },
  { to: "/settings", label: "Профиль", icon: PhUser },
];

function isNavActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <!-- Mobile navbar -->
  <nav class="grid h-14 grid-cols-4 items-center px-2 lg:hidden">
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center justify-center gap-1"
      :class="isNavActive(item.to) ? 'text-primary-white' : 'text-primary-gray'"
    >
      <component :is="item.icon" :size="24" weight="light" />
    </NuxtLink>
  </nav>
</template>
