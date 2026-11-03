<script setup lang="ts">
/**
 * AppLayout — shell: header (desktop), sidebar, страница, player.
 */
import { PhGear, PhSignOut, PhUser } from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const playerStore = usePlayerStore();
const { user } = useUserSession();
const menuOpen = ref(false);

const hideShell = computed(
  () => playerStore.showPlayer && playerStore.isExpanded,
);

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
  <div
    class="relative flex h-dvh flex-col overflow-hidden bg-tone-shell text-tone-white"
  >
    <!-- Shell: скрываем при expanded, не размонтируем -->
    <div
      class="flex min-h-0 min-w-0 flex-1 flex-col"
      :class="hideShell ? 'invisible pointer-events-none' : null"
    >
      <!-- Desktop header: лого · поиск · аватар -->
      <header
        class="hidden h-16 w-full shrink-0 px-2 lg:grid lg:grid-cols-3 lg:items-center lg:px-6"
      >
        <div class="flex min-w-0 items-center justify-start">
          <NuxtLink
            to="/home"
            class="inline-flex shrink-0 items-center gap-1 leading-none text-tone-white transition-colors hover:text-tone-muted"
            aria-label="Pulsar"
          >
            <AppLogoMark class="size-8" />
            <span class="text-xl font-bold">Pulsar</span>
          </NuxtLink>
        </div>

        <div class="flex min-w-0 items-center justify-center px-4">
          <SearchField class="w-full max-w-xl" />
        </div>

        <div class="flex min-w-0 items-center justify-end gap-2">
          <ThemeToggle />

          <UiButton
            variant="gray"
            text="Выложить альбом"
            icon="UploadSimple"
            type="button"
            @click="navigateTo('/upload')"
          />

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

      <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden lg:px-2">
        <div class="hidden min-h-0 shrink-0 self-stretch lg:flex">
          <AppLibrarySidebar />
        </div>

        <main
          class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-tone-canvas [scrollbar-color:var(--color-tone-muted)_transparent] [scrollbar-width:thin] lg:rounded-lg"
        >
          <slot />

          <AppFooter class="px-4 pb-4 lg:px-6 lg:pb-6" />
        </main>
      </div>

      <AppPlayerDesktop />

      <div class="shrink-0 lg:hidden">
        <AppPlayerMobile />
        <AppNavbarMobile />
      </div>
    </div>

    <AppPlayerExpandedDesktop />
    <AppPlayerExpandedMobile />
    <AppAudioHost />
  </div>
</template>
