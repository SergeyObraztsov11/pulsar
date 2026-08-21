<script setup lang="ts">
/**
 * GuestHeader — лого + Войти / Создать аккаунт (лендинг).
 */
</script>

<template>
  <HeaderLayout>
    <!-- Band: logo | auth CTAs -->
    <div class="flex h-full w-full items-center justify-between gap-4">
      
      <AppLogo to="/" />

      <div class="flex shrink-0 items-center gap-2">
        <UiButton
          variant="ghost"
          text="Войти"
          @click="navigateTo('/login')"
        />
        <UiButton
          text="Создать аккаунт"
          @click="navigateTo('/register')"
        />
      </div>
    </div>
  </HeaderLayout>
</template>
