<script setup lang="ts">
/**
 * Регистрация по шагам: имя → дата и пол → email → пароль → код.
 */
definePageMeta({
  layout: "auth-layout",
});

const STEPS = [
  "Укажите, как вас зовут.",
  "Укажите дату рождения и пол.",
  "Укажите email.",
  "Придумайте пароль.",
  "Введите код из письма.",
] as const;

const step = ref(0);
const stepDirection = ref<"forward" | "back">("forward");
const name = ref("");
const birthDay = ref("");
const birthMonth = ref("");
const birthYear = ref("");
const gender = ref("");
const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const code = ref("");

const { fetch: refreshSession } = useUserSession();

const stepHint = computed(() => STEPS[step.value]);
const isLastStep = computed(() => step.value === STEPS.length - 1);
const pending = ref(false);
const errorMessage = ref("");

const isEmailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
);

const isBirthDayValid = computed(() => {
  const day = Number(birthDay.value);
  return birthDay.value.trim().length > 0 && day >= 1 && day <= 31;
});

const isBirthYearValid = computed(() => {
  if (!/^\d{4}$/.test(birthYear.value)) return false;
  const year = Number(birthYear.value);
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
});

/** Можно ли идти дальше: поля текущего шага заполнены */
const canGoNext = computed(() => {
  switch (step.value) {
    case 0:
      return name.value.trim().length > 0 && name.value.trim().length <= 50;
    case 1:
      return (
        isBirthDayValid.value &&
        Boolean(birthMonth.value) &&
        isBirthYearValid.value &&
        Boolean(gender.value)
      );
    case 2:
      return isEmailValid.value;
    case 3:
      return (
        password.value.length >= 8 && password.value === passwordConfirm.value
      );
    case 4:
      return code.value.length === 4;
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
    await $fetch("/api/auth/register/send-code", {
      method: "POST",
      body: {
        name: name.value,
        day: birthDay.value,
        month: birthMonth.value,
        year: birthYear.value,
        gender: gender.value,
        email: email.value,
        password: password.value,
      },
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

/** Проверяю код и вхожу */
async function verifyCode() {
  pending.value = true;
  errorMessage.value = "";
  const startedAt = Date.now();
  try {
    await $fetch("/api/auth/register/verify", {
      method: "POST",
      body: {
        email: email.value,
        code: code.value,
      },
    });
    await waitAtLeast(startedAt);
    await refreshSession();
    await navigateTo("/onboarding");
  } catch (error) {
    await waitAtLeast(startedAt);
    errorMessage.value = errorText(error);
  } finally {
    pending.value = false;
  }
}

/** Следующий шаг или отправка / проверка кода */
async function goNext() {
  if (!canGoNext.value || pending.value) return;
  errorMessage.value = "";

  if (step.value === 3) {
    await sendCode(true);
    return;
  }
  if (step.value === 4) {
    await verifyCode();
    return;
  }

  stepDirection.value = "forward";
  step.value += 1;
}

watch(code, (value) => {
  if (errorMessage.value) errorMessage.value = "";
  if (step.value !== 4 || value.length !== 4 || pending.value) return;
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
  <div class="flex w-full flex-col gap-4  lg:min-w-3xl">
    <!-- Карточка регистрации -->
    <div
      class="flex w-full flex-col gap-6 rounded-2xl border border-primary-gray-dark p-6 lg:h-96 lg:gap-8 lg:p-8"
      :style="{
        '--step-sign': stepDirection === 'forward' ? '1' : '-1',
      }"
    >
      <RegisterProgress :current="step" :total="STEPS.length" :busy="pending" />

      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div class="flex min-w-0 flex-col gap-4 lg:gap-6">
          <AppLogo to="/" />
          <div class="flex flex-col gap-3">
            <h1
              class="text-3xl font-bold leading-none text-primary-white sm:text-4xl"
            >
              Создание аккаунта
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
              <RegisterStepName v-if="step === 0" v-model="name" />
              <RegisterStepPersonal
                v-else-if="step === 1"
                v-model:day="birthDay"
                v-model:month="birthMonth"
                v-model:year="birthYear"
                v-model:gender="gender"
              />
              <RegisterStepEmail v-else-if="step === 2" v-model="email" />
              <RegisterStepPassword
                v-else-if="step === 3"
                v-model:password="password"
                v-model:password-confirm="passwordConfirm"
              />
              <RegisterStepCode
                v-else
                v-model="code"
                :email="email"
                :pending="pending"
                :invalid="Boolean(errorMessage)"
                @resend="sendCode(false)"
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
            :text="isLastStep ? 'Подтвердить' : 'Далее'"
            :disabled="!canGoNext || pending"
            @click="goNext"
          />
        </div>
      </div>
    </div>

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
