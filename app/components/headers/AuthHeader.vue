<script setup lang="ts">
/**
 * AuthHeader — лого | (desktop: поиск) | колокол | аватар.
 * Mobile и desktop в одном хедере; меню профиля — MenuResponsive.
 */
import {
  PhGear,
  PhHeart,
  PhSignOut,
  PhUploadSimple,
  PhUser,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const route = useRoute();
const { user } = useUserSession();
const menuOpen = ref(false);

/** На /search поле в шапке не дублируем — там своё крупное */
const showHeaderSearch = computed(() => route.path !== "/search");

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
    <!-- Band: logo | search (lg+) | bell | avatar -->
    <div class="flex h-full w-full items-center gap-3">
      <AppLogo to="/home" />

      <SearchField
        v-if="showHeaderSearch"
        class="hidden min-w-0 flex-1 lg:block"
      />

      <div
        class="flex shrink-0 items-center gap-1"
        :class="showHeaderSearch ? 'ml-auto lg:ml-0' : 'ml-auto'"
      >
        <UiButton variant="gray" icon="Bell" aria-label="Notifications" />

        <MenuResponsive v-model:open="menuOpen" :items="menuItems">
          <template #trigger>
            <button
              type="button"
              class="relative inline-flex size-10 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
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
