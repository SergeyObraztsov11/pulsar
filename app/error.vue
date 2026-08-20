<script setup lang="ts">
/**
 * Глобальная страница ошибок (404 и прочие).
 */
import type { NuxtError } from "#app";

const props = defineProps<{
  error: NuxtError;
}>();

const { loggedIn } = useUserSession();

const isNotFound = computed(() => props.error?.statusCode === 404);

const codeLabel = computed(() => String(props.error?.statusCode ?? 500));

const title = computed(() =>
  isNotFound.value ? "Страница не найдена." : "Что-то пошло не так.",
);

const description = computed(() =>
  isNotFound.value
    ? "Ссылка битая или страница переехала. Вернись и продолжай слушать."
    : "Мы уже в курсе. Попробуй ещё раз через минуту.",
);

const homeTo = computed(() => (loggedIn.value ? "/home" : "/"));

function goHome() {
  clearError({ redirect: homeTo.value });
}
</script>

<template>
  <div
    class="relative flex min-h-dvh flex-col overflow-hidden bg-primary-black text-primary-white"
  >
    <!-- Stage -->
    <div
      class="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-8 px-8 pb-24"
    >
      <!-- Oversized code + glow -->
      <!-- Animation: fade-up -->
      <div
        class="relative animate-fade-up motion-reduce:animate-none [animation-delay:0ms]"
      >
        <!-- Animation: glow breathe behind code -->
        <div
          class="pointer-events-none absolute top-1/2 left-1/2 size-80 rounded-full bg-accent/35 blur-3xl animate-glow-breathe motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p
          class="relative text-[clamp(7rem,24vw,14rem)] font-bold leading-none tracking-tighter text-primary-white/[0.08] select-none"
        >
          {{ codeLabel }}
        </p>
      </div>

      <!-- Copy + CTAs -->
      <!-- Animation: fade-up + delay 120ms -->
      <div
        class="relative flex max-w-lg flex-col gap-8 animate-fade-up motion-reduce:animate-none [animation-delay:120ms]"
      >
        <div class="flex flex-col gap-4">
          <h1
            class="text-5xl font-bold text-primary-white"
          >
            {{ title }}
          </h1>
          <p class="text-xl text-primary-gray">
            {{ description }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UiButton text="На главную" @click="goHome" />
          <UiButton
            v-if="!loggedIn"
            variant="ghost"
            text="Войти"
            @click="clearError({ redirect: '/login' })"
          />
        </div>
      </div>
    </div>
  </div>
</template>
