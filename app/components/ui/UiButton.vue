<script setup lang="ts">
/**
 * UiButton — white / gray / ghost / outline / loading.
 * Подпись и иконка — пропсы `text` и `icon` (имя Phosphor без префикса Ph).
 * Внешняя ссылка — проп `href` (рендер как <a>).
 */
import {
  PhAppleLogo,
  PhArrowLeft,
  PhBell,
  PhCaretDown,
  PhCaretLeft,
  PhCaretRight,
  PhCaretUp,
  PhCamera,
  PhDotsThree,
  PhHeart,
  PhInstagramLogo,
  PhMusicNotes,
  PhPause,
  PhPencilSimple,
  PhPlay,
  PhQueue,
  PhShareNetwork,
  PhSidebar,
  PhSidebarSimple,
  PhSkipBack,
  PhSkipForward,
  PhSpeakerHigh,
  PhSpeakerLow,
  PhSpeakerNone,
  PhSpeakerSimpleX,
  PhSpotifyLogo,
  PhTelegramLogo,
  PhTextAlignLeft,
  PhTiktokLogo,
  PhUploadSimple,
  PhX,
  PhYoutubeLogo,
} from "@phosphor-icons/vue";

const ICONS = {
  AppleLogo: PhAppleLogo,
  ArrowLeft: PhArrowLeft,
  Bell: PhBell,
  CaretDown: PhCaretDown,
  CaretLeft: PhCaretLeft,
  CaretRight: PhCaretRight,
  CaretUp: PhCaretUp,
  Camera: PhCamera,
  DotsThree: PhDotsThree,
  Heart: PhHeart,
  InstagramLogo: PhInstagramLogo,
  MusicNotes: PhMusicNotes,
  Pause: PhPause,
  PencilSimple: PhPencilSimple,
  Play: PhPlay,
  Queue: PhQueue,
  ShareNetwork: PhShareNetwork,
  Sidebar: PhSidebar,
  SidebarSimple: PhSidebarSimple,
  SkipBack: PhSkipBack,
  SkipForward: PhSkipForward,
  SpeakerHigh: PhSpeakerHigh,
  SpeakerLow: PhSpeakerLow,
  SpeakerNone: PhSpeakerNone,
  SpeakerSimpleX: PhSpeakerSimpleX,
  SpotifyLogo: PhSpotifyLogo,
  TelegramLogo: PhTelegramLogo,
  TextAlignLeft: PhTextAlignLeft,
  TiktokLogo: PhTiktokLogo,
  UploadSimple: PhUploadSimple,
  X: PhX,
  YoutubeLogo: PhYoutubeLogo,
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
    /** Если задан — рендер как ссылка */
    href?: string;
    /** target для href (по умолчанию _blank для внешних) */
    target?: string;
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

const isLink = computed(() => Boolean(props.href) && !isLoading.value);

/** Только иконка — круг size-10, без горизонтального паддинга */
const isIconOnly = computed(
  () => Boolean(props.icon) && !props.text && !isLoading.value,
);

const linkTarget = computed(() => {
  if (!isLink.value) return undefined;
  return props.target ?? "_blank";
});

const linkRel = computed(() => {
  if (linkTarget.value === "_blank") return "noopener noreferrer";
  return undefined;
});

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
  <a
    v-if="isLink"
    :href="props.href"
    :class="rootClass"
    :target="linkTarget"
    :rel="linkRel"
    :aria-disabled="props.disabled || undefined"
  >
    <component
      :is="iconComponent"
      v-if="iconComponent"
      :size="20"
      :weight="props.filled ? 'fill' : 'light'"
    />
    <span v-if="props.text" class="text-medium">{{ props.text }}</span>
  </a>

  <button
    v-else
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
      <span v-if="props.text" class="text-medium">{{ props.text }}</span>
    </template>
  </button>
</template>
