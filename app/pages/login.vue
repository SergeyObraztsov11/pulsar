<script setup lang="ts">
/**
 * Вход: email и пароль в карточке как у регистрации.
 */
definePageMeta({
  layout: "auth-layout",
});

const { fetch: refreshSession } = useUserSession();

const email = ref("");
const password = ref("");
const isPasswordVisible = ref(false);
const pending = ref(false);
const errorMessage = ref("");

const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
);

const canSubmit = computed(
  () => isEmailValid.value && password.value.length > 0,
);

/** Загрузка видна не меньше секунды */
function waitAtLeast(startedAt: number) {
  if (
    import.meta.client &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return Promise.resolve();
  }
  const left = 1000 - (Date.now() - startedAt);
  if (left <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => setTimeout(resolve, left));
}

/** Переход к сбросу пароля, email подставляю если уже введён */
function goForgot() {
  return navigateTo({
    path: "/forgot-password",
    query: isEmailValid.value ? { email: email.value.trim() } : undefined,
  });
}

async function onSubmit() {
  if (!canSubmit.value || pending.value) return;
  errorMessage.value = "";
  pending.value = true;
  const startedAt = Date.now();
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
      },
    });
    await waitAtLeast(startedAt);
    await refreshSession();
    await navigateTo("/home");
  } catch {
    await waitAtLeast(startedAt);
    errorMessage.value = "Неверный email или пароль";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="flex w-full flex-col gap-4 lg:min-w-3xl">
    <!-- Карточка входа -->
    <form
      class="flex w-full flex-col gap-6 rounded-2xl border border-primary-gray-dark p-6 lg:h-96 lg:gap-8 lg:p-8"
      @submit.prevent="onSubmit"
    >
      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div class="flex min-w-0 flex-col gap-4 lg:gap-6">
          <AppLogo to="/" />
          <div class="flex flex-col gap-3">
            <h1
              class="text-3xl font-bold leading-none text-primary-white sm:text-4xl"
            >
              Вход в аккаунт
            </h1>
            <p class="text-xl text-primary-gray">Введите email и пароль.</p>
          </div>
        </div>

        <div
          class="flex min-h-0 flex-col justify-center gap-4 transition-opacity duration-200 lg:h-full"
          :class="pending ? 'pointer-events-none opacity-40' : ''"
        >
          <UiTextField
            v-model.trim="email"
            type="email"
            name="email"
            autocomplete="email"
            autofocus
            placeholder="Email"
          />

          <UiTextField
            v-model="password"
            :type="isPasswordVisible ? 'text' : 'password'"
            name="password"
            autocomplete="current-password"
            placeholder="Пароль"
          />

          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              class="text-sm text-primary-gray transition-colors hover:text-primary-white"
              @click="goForgot"
            >
              Забыли пароль?
            </button>
            <button
              type="button"
              class="shrink-0 text-sm text-primary-gray transition-colors hover:text-primary-white"
              @click="isPasswordVisible = !isPasswordVisible"
            >
              {{ isPasswordVisible ? "Скрыть пароль" : "Показать пароль" }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <p class="min-h-5 min-w-0 flex-1 text-sm leading-none text-danger">
          {{ errorMessage }}
        </p>
        <div class="flex shrink-0 flex-row justify-end gap-2">
          <UiButton
            variant="ghost"
            text="Создать аккаунт"
            :disabled="pending"
            @click="navigateTo('/register')"
          />
          <UiButton
            type="submit"
            text="Войти"
            :disabled="!canSubmit || pending"
          />
        </div>
      </div>
    </form>

    <p class="text-sm leading-normal text-primary-gray">
      Продолжая, вы принимаете
      <NuxtLink to="/terms" class="font-bold hover:underline">
        Условия использования
      </NuxtLink>
      и
      <NuxtLink to="/privacy" class="font-bold hover:underline">
        Политику конфиденциальности
      </NuxtLink>
    </p>
  </div>
</template>
