<script setup lang="ts">
/**
 * RegisterStepCode — код из письма, 4 ячейки.
 */
const code = defineModel<string>({ default: "" });

defineProps<{
  /** Email, на который уйдёт код */
  email: string;
  pending?: boolean;
  invalid?: boolean;
}>();

const emit = defineEmits<{
  resend: [];
}>();
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <UiOtpField v-model="code" :invalid="invalid" />
    <p class="text-center text-sm text-primary-gray">
      Код придёт на
      {{ email || "указанный email" }}.
    </p>
    <button
      type="button"
      class="text-sm text-primary-gray transition-colors hover:text-primary-white disabled:opacity-40"
      :disabled="pending"
      @click="emit('resend')"
    >
      Отправить код ещё раз
    </button>
  </div>
</template>
