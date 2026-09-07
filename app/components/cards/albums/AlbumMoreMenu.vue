<script setup lang="ts">
/**
 * AlbumMoreMenu — действия альбома через MenuResponsive.
 * Триггер — слот #trigger (кнопку держит родитель).
 */
import {
  PhDisc,
  PhFlag,
  PhHeart,
  PhPause,
  PhPlay,
  PhShareNetwork,
  PhUser,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const LIKED_MENU_LABEL = "Мне нравится";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  isLiked: boolean;
  /** Альбом сейчас играет в плеере */
  isPlaying?: boolean;
}>();

const emit = defineEmits<{
  play: [];
  "toggle-like": [];
  "go-album": [];
  "go-artist": [];
  share: [];
  report: [];
}>();

const items = computed<MenuItem[]>(() => [
  {
    id: "play",
    label: props.isPlaying ? "Пауза" : "Слушать",
    icon: props.isPlaying ? PhPause : PhPlay,
    onClick: () => emit("play"),
  },
  {
    id: "like",
    label: props.isLiked
      ? `Убрать из «${LIKED_MENU_LABEL}»`
      : `Добавить в «${LIKED_MENU_LABEL}»`,
    icon: PhHeart,
    iconWeight: props.isLiked ? "fill" : "light",
    iconClass: props.isLiked ? "text-tone-white" : undefined,
    labelClass: props.isLiked ? "text-tone-white" : undefined,
    onClick: () => emit("toggle-like"),
  },
  {
    id: "album",
    label: "Перейти к альбому",
    icon: PhDisc,
    onClick: () => emit("go-album"),
  },
  {
    id: "artist",
    label: "Перейти к артисту",
    icon: PhUser,
    onClick: () => emit("go-artist"),
  },
  {
    id: "share",
    label: "Поделиться",
    icon: PhShareNetwork,
    onClick: () => emit("share"),
  },
  {
    id: "report",
    label: "Пожаловаться",
    icon: PhFlag,
    onClick: () => emit("report"),
  },
]);
</script>

<template>
  <MenuResponsive v-model:open="open" :items="items">
    <template #trigger="slotProps">
      <slot name="trigger" v-bind="slotProps" />
    </template>
  </MenuResponsive>
</template>
