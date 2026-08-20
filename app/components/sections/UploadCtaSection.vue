<script setup lang="ts">
/**
 * UploadCtaSection — creator-CTA: заявление + кнопка загрузки.
 */
const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: "Твой звук. Твои первые фанаты.",
    description: "Загрузи трек — его услышат уже сегодня.",
  },
);
</script>

<template>
  <!-- Upload CTA -->
  <section class="flex flex-col items-center gap-3 justify-center">
    <h2 class="text-3xl font-bold text-primary-white">
      {{ props.title }}
    </h2>
    <UiButton
      icon="UploadSimple"
      text="Загрузить"
      @click="navigateTo('/upload')"
    />
    <p class="text-primary-gray">
      {{ props.description }}
    </p>
  </section>
</template>
