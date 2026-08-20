<script setup lang="ts">
/**
 * SplitFeatureSection — заявление + визуал в две колонки.
 * isReverse — текст справа; без imageSrc можно передать слот visual.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    /** Обложка напротив текста */
    imageSrc?: string | null;
    imageAlt?: string;
    /** Текст справа, визуал слева */
    isReverse?: boolean;
    buttonText?: string;
    /** Переход по CTA */
    href?: string;
    /** Скелетон обложки, пока данные не пришли */
    isLoading?: boolean;
  }>(),
  {
    isReverse: false,
    imageAlt: "",
    isLoading: false,
  },
);

/** CTA: переход, если задан href */
function onActionClick() {
  if (props.href) navigateTo(props.href);
}
</script>

<template>
  <!-- Split: copy + visual -->
  <section
    class="flex flex-col gap-10 lg:items-center lg:gap-12"
    :class="props.isReverse ? 'lg:flex-row-reverse' : 'lg:flex-row'"
  >
    <!-- Copy -->
    <div class="flex max-w-xl shrink-0 flex-col gap-6 lg:w-[46%]">
      <h2 class="text-3xl font-bold text-primary-white sm:text-4xl">
        {{ props.title }}
      </h2>
      <p v-if="props.description" class="text-xl text-primary-gray">
        {{ props.description }}
      </p>
      <slot v-if="$slots.action" name="action" />
      <UiButton
        v-else-if="props.buttonText"
        :text="props.buttonText"
        @click="onActionClick"
      />
    </div>

    <!-- Visual: слот или обложка + glow -->
    <div class="relative flex min-w-0 flex-1 items-center justify-center">
      <slot v-if="$slots.visual" name="visual" />
      <div v-else class="relative w-full max-w-xs lg:max-w-sm">
        <div
          class="absolute top-1/2 left-1/2 size-64 rounded-full bg-accent/20 blur-3xl animate-glow-breathe motion-reduce:animate-none lg:size-72"
        />

        <div
          v-if="props.isLoading"
          class="relative z-10 aspect-square animate-pulse rounded-md bg-primary-gray-dark"
        />
        <div
          v-else
          class="relative z-10 aspect-square overflow-hidden rounded-md bg-primary-gray-dark"
        >
          <UiCoverImage :src="props.imageSrc" :alt="props.imageAlt" />
        </div>
      </div>
    </div>
  </section>
</template>
