<script setup lang="ts">
/**
 * UiButton — white / gray / ghost / outline / loading.
 * Подпись и иконка — пропсы `text` и `icon` (имя Phosphor без префикса Ph).
 * Переход по ссылке снаружи, не через кнопку.
 */
import {
  PhArrowLeft,
  PhBell,
  PhCaretDown,
  PhCaretLeft,
  PhCaretRight,
  PhCaretUp,
  PhDotsThree,
  PhHeart,
  PhPause,
  PhPlay,
  PhQueue,
  PhSidebar,
  PhSidebarSimple,
  PhSkipBack,
  PhSkipForward,
  PhSpeakerHigh,
  PhSpeakerLow,
  PhSpeakerNone,
  PhSpeakerSimpleX,
  PhTextAlignLeft,
  PhUploadSimple,
  PhX,
} from "@phosphor-icons/vue";

const ICONS = {
  ArrowLeft: PhArrowLeft,
  Bell: PhBell,
  CaretDown: PhCaretDown,
  CaretLeft: PhCaretLeft,
  CaretRight: PhCaretRight,
  CaretUp: PhCaretUp,
  DotsThree: PhDotsThree,
  Heart: PhHeart,
  Pause: PhPause,
  Play: PhPlay,
  Queue: PhQueue,
  Sidebar: PhSidebar,
  SidebarSimple: PhSidebarSimple,
  SkipBack: PhSkipBack,
  SkipForward: PhSkipForward,
  SpeakerHigh: PhSpeakerHigh,
  SpeakerLow: PhSpeakerLow,
  SpeakerNone: PhSpeakerNone,
  SpeakerSimpleX: PhSpeakerSimpleX,
  TextAlignLeft: PhTextAlignLeft,
  UploadSimple: PhUploadSimple,
  X: PhX,
} as const;

type IconName = keyof typeof ICONS;

const props = withDefaults(
  defineProps<{
    variant?: "white" | "gray" | "ghost" | "outline" | "loading";
    type?: "button" | "submit" | "reset";
    text?: string;
    icon?: IconName;
    /** true — иконка fill, иначе light */
    filled?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: "white",
    type: "button",
    filled: false,
    disabled: false,
  },
);

const iconComponent = computed(() => (props.icon ? ICONS[props.icon] : null));

const isLoading = computed(() => props.variant === "loading");

/** Только иконка — круг size-10, без горизонтального паддинга */
const isIconOnly = computed(
  () => Boolean(props.icon) && !props.text && !isLoading.value,
);

const VARIANT_CLASS = {
  white:
    "border-transparent bg-primary-white text-primary-black hover:bg-primary-gray-light",
  gray: "border-transparent bg-primary-gray-dark text-primary-white hover:bg-primary-gray/50",
  ghost: "border-transparent text-primary-white hover:text-primary-gray",
  outline:
    "border-primary-gray-dark text-primary-white hover:border-primary-white disabled:hover:border-primary-gray-dark",
  loading:
    "pointer-events-none relative overflow-hidden border-transparent bg-primary-gray-dark",
} as const;

const rootClass = computed(() => {
  const shape = isIconOnly.value ? "size-10" : "min-w-10 px-4";

  return [
    "inline-flex shrink-0 box-border h-10 items-center justify-center gap-2 leading-none rounded-full border transition-[color,background-color,border-color] duration-200",
    isLoading.value ? "" : "disabled:pointer-events-none disabled:opacity-40",
    shape,
    VARIANT_CLASS[props.variant],
  ].join(" ");
});
</script>

<template>
  <button
    :type="props.type"
    :class="rootClass"
    :disabled="isLoading || disabled"
    :aria-busy="isLoading || undefined"
    :aria-hidden="isLoading || undefined"
  >
    <!-- Перелив загрузки -->
    <span
      v-if="isLoading"
      class="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-linear-to-r from-transparent via-primary-gray to-transparent animate-progress-sheen motion-reduce:hidden"
      aria-hidden="true"
    />

    <template v-if="!isLoading">
      <component
        :is="iconComponent"
        v-if="iconComponent"
        :size="20"
        :weight="props.filled ? 'fill' : 'light'"
      />
      <span class="text-medium" v-if="props.text">{{ props.text }}</span>
    </template>
  </button>
</template>
