<script setup lang="ts">
/**
 * Сброс пароля: email → код → новый пароль.
 */
definePageMeta({
  layout: "auth-layout",
});

const STEPS = [
  "Укажите email.",
  "Введите код из письма.",
  "Придумайте новый пароль.",
] as const;

const route = useRoute();
const { fetch: refreshSession } = useUserSession();

const step = ref(0);
const stepDirection = ref<"forward" | "back">("forward");
const email = ref(
  typeof route.query.email === "string" ? route.query.email : "",
);
const code = ref("");
const password = ref("");
const passwordConfirm = ref("");
const pending = ref(false);
const errorMessage = ref("");

const stepHint = computed(() => STEPS[step.value]);
const isLastStep = computed(() => step.value === STEPS.length - 1);

const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
);

/** Можно ли идти дальше: поля текущего шага заполнены */
const canGoNext = computed(() => {
  switch (step.value) {
    case 0:
      return isEmailValid.value;
    case 1:
      return code.value.length === 4;
    case 2:
      return (
        password.value.length >= 8 && password.value === passwordConfirm.value
      );
    default:
      return false;
  }
});

/** Текст ошибки $fetch */
function errorText(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { statusMessage?: string; message?: string } })
      .data;
    if (data?.statusMessage) return data.statusMessage;
    if (data?.message) return data.message;
  }
  return "Не получилось. Попробуйте ещё раз.";
}

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

/** Отправляю код; при advance перехожу на шаг кода */
async function sendCode(advance: boolean) {
  pending.value = true;
  errorMessage.value = "";
  const startedAt = Date.now();
  try {
    await $fetch("/api/auth/forgot/send-code", {
      method: "POST",
      body: { email: email.value },
    });
    await waitAtLeast(startedAt);
    if (advance) {
      stepDirection.value = "forward";
      step.value += 1;
    }
  } catch (error) {
    await waitAtLeast(startedAt);
    errorMessage.value = errorText(error);
  } finally {
    pending.value = false;
  }
}

/** Проверяю код и иду к паролю */
async function verifyCode() {
  pending.value = true;
  errorMessage.value = "";
  const startedAt = Date.now();
  try {
    await $fetch("/api/auth/forgot/verify", {
      method: "POST",
      body: {
        email: email.value,
        code: code.value,
      },
    });
    await waitAtLeast(startedAt);
    stepDirection.value = "forward";
    step.value += 1;
  } catch (error) {
    await waitAtLeast(startedAt);
    errorMessage.value = errorText(error);
  } finally {
    pending.value = false;
  }
}

/** Сохраняю пароль и вхожу */
async function resetPassword() {
  pending.value = true;
  errorMessage.value = "";
  const startedAt = Date.now();
  try {
    await $fetch("/api/auth/forgot/reset", {
      method: "POST",
      body: {
        email: email.value,
        code: code.value,
        password: password.value,
      },
    });
    await waitAtLeast(startedAt);
    await refreshSession();
    await navigateTo("/home");
  } catch (error) {
    await waitAtLeast(startedAt);
    errorMessage.value = errorText(error);
  } finally {
    pending.value = false;
  }
}

/** Следующий шаг или запрос */
async function goNext() {
  if (!canGoNext.value || pending.value) return;
  errorMessage.value = "";

  if (step.value === 0) {
    await sendCode(true);
    return;
  }
  if (step.value === 1) {
    await verifyCode();
    return;
  }
  await resetPassword();
}

watch(code, (value) => {
  if (errorMessage.value) errorMessage.value = "";
  if (step.value !== 1 || value.length !== 4 || pending.value) return;
  void verifyCode();
});

/** Предыдущий шаг */
function goBack() {
  if (step.value === 0) return;
  errorMessage.value = "";
  stepDirection.value = "back";
  step.value -= 1;
}
</script>

<template>
  <div class="flex w-full flex-col gap-4 lg:min-w-3xl">
    <!-- Карточка сброса пароля -->
    <div
      class="flex w-full flex-col gap-6 rounded-2xl border border-primary-gray-dark p-6 lg:h-96 lg:gap-8 lg:p-8"
      :style="{
        '--step-sign': stepDirection === 'forward' ? '1' : '-1',
      }"
    >
      <RegisterProgress
        :current="step"
        :total="STEPS.length"
        :busy="pending"
        label="Шаг сброса пароля"
      />

      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div class="flex min-w-0 flex-col gap-4 lg:gap-6">
          <AppLogo to="/" />
          <div class="flex flex-col gap-3">
            <h1
              class="text-3xl font-bold leading-none text-primary-white sm:text-4xl"
            >
              Сброс пароля
            </h1>
            <div class="relative min-h-7 overflow-hidden">
              <Transition name="step" mode="out-in">
                <p :key="step" class="text-xl text-primary-gray">
                  {{ stepHint }}
                </p>
              </Transition>
            </div>
          </div>
        </div>

        <div
          class="flex min-h-0 flex-col justify-center transition-opacity duration-200 lg:h-full"
          :class="pending ? 'pointer-events-none opacity-40' : ''"
        >
          <Transition name="step" mode="out-in">
            <div :key="step" class="w-full">
              <RegisterStepEmail v-if="step === 0" v-model="email" />
              <RegisterStepCode
                v-else-if="step === 1"
                v-model="code"
                :email="email"
                :pending="pending"
                :invalid="Boolean(errorMessage)"
                @resend="sendCode(false)"
              />
              <RegisterStepPassword
                v-else
                v-model:password="password"
                v-model:password-confirm="passwordConfirm"
              />
            </div>
          </Transition>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <p class="min-h-5 min-w-0 flex-1 text-sm leading-none text-danger">
          {{ errorMessage }}
        </p>
        <div class="flex shrink-0 flex-row justify-end gap-2">
          <UiButton
            v-if="step === 0"
            variant="ghost"
            text="Войти"
            @click="navigateTo('/login')"
          />
          <UiButton
            v-else
            variant="ghost"
            text="Назад"
            :disabled="pending"
            @click="goBack"
          />
          <UiButton
            :text="isLastStep ? 'Сохранить' : 'Далее'"
            :disabled="!canGoNext || pending"
            @click="goNext"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Смена шага: hint и поля */
.step-enter-active,
.step-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(calc(var(--step-sign, 1) * 12px));
}

.step-leave-to {
  opacity: 0;
  transform: translateX(calc(var(--step-sign, 1) * -12px));
}

@media (prefers-reduced-motion: reduce) {
  .step-enter-active,
  .step-leave-active {
    transition: none;
  }

  .step-enter-from,
  .step-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
