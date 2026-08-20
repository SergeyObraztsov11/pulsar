<script setup lang="ts">
/**
 * RegisterStepPassword — пароль и повтор.
 */
const password = defineModel<string>("password", { default: "" });
const passwordConfirm = defineModel<string>("passwordConfirm", {
  default: "",
});

const isPasswordVisible = ref(false);
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <UiTextField
      v-model="password"
      :type="isPasswordVisible ? 'text' : 'password'"
      name="password"
      autocomplete="new-password"
      autofocus
      placeholder="Пароль"
    />

    <UiTextField
      v-model="passwordConfirm"
      :type="isPasswordVisible ? 'text' : 'password'"
      name="password-confirm"
      autocomplete="new-password"
      placeholder="Повтор пароля"
    />

    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-primary-gray">Не меньше 8 символов.</p>
      <button
        type="button"
        class="shrink-0 text-sm text-primary-gray transition-colors hover:text-primary-white"
        @click="isPasswordVisible = !isPasswordVisible"
      >
        {{ isPasswordVisible ? "Скрыть пароль" : "Показать пароль" }}
      </button>
    </div>
  </div>
</template>
