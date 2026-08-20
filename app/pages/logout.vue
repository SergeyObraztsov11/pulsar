<script setup lang="ts">
/**
 * Logout — сброс сессии и редирект на login.
 */
definePageMeta({
  layout: false,
});

const { clear } = useUserSession();

await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
await clear();
await navigateTo("/login");
</script>

<template>
  <p class="p-8 text-primary-gray">Выход…</p>
</template>
