<script setup lang="ts">
/**
 * Онбординг после регистрации: жанры → исполнители.
 * Пока без выбора — только навигация.
 */
definePageMeta({
  layout: "auth-layout",
});

const STEPS = [
  "Выберите любимые жанры.",
  "Выберите любимых исполнителей.",
] as const;

const step = ref(0);
const stepDirection = ref<"forward" | "back">("forward");

const stepHint = computed(() => STEPS[step.value]);
const isLastStep = computed(() => step.value === STEPS.length - 1);

/** Следующий шаг или на главную */
function goNext() {
  if (isLastStep.value) {
    void finish();
    return;
  }
  stepDirection.value = "forward";
  step.value += 1;
}

/** Пропустить оставшиеся шаги */
function skip() {
  void finish();
}

/** Конец онбординга */
function finish() {
  return navigateTo("/home");
}
</script>

<template>
  <div class="flex w-full flex-col gap-4 lg:min-w-3xl">
    <!-- Карточка онбординга -->
    <div
      class="flex w-full flex-col gap-6 rounded-2xl border border-primary-gray-dark p-6 lg:h-96 lg:gap-8 lg:p-8"
      :style="{
        '--step-sign': stepDirection === 'forward' ? '1' : '-1',
      }"
    >
      <RegisterProgress :current="step" :total="STEPS.length" />

      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div class="flex min-w-0 flex-col gap-4 lg:gap-6">
          <AppLogo to="/" />
          <div class="flex flex-col gap-3">
            <h1
              class="text-3xl font-bold leading-none text-primary-white sm:text-4xl"
            >
              Что вы слушаете
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

        <div class="min-h-0 lg:h-full" />
      </div>

      <div class="flex flex-row justify-end gap-2">
        <UiButton variant="ghost" text="Пропустить" @click="skip" />
        <UiButton
          :text="isLastStep ? 'Готово' : 'Далее'"
          @click="goNext"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Смена шага: hint */
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
