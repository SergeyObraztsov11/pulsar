<script setup lang="ts">
/**
 * TrackMoreMenu — track “⋯” actions via MenuResponsive.
 * Trigger comes from #trigger slot (parent owns the button).
 */
import {
  PhDisc,
  PhFlag,
  PhHeart,
  PhListPlus,
  PhPause,
  PhPlay,
  PhShareNetwork,
  PhUser,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  isPlayingCurrent: boolean;
  isLiked: boolean;
}>();

const emit = defineEmits<{
  play: [];
  "toggle-like": [];
}>();

const items = computed<MenuItem[]>(() => [
  {
    id: "play",
    label: props.isPlayingCurrent ? "Pause" : "Play",
    icon: props.isPlayingCurrent ? PhPause : PhPlay,
    onClick: () => emit("play"),
  },
  {
    id: "like",
    label: props.isLiked ? "Unlike" : "Like",
    icon: PhHeart,
    iconWeight: props.isLiked ? "fill" : "light",
    iconClass: props.isLiked ? "text-accent" : undefined,
    labelClass: props.isLiked ? "text-accent" : undefined,
    onClick: () => emit("toggle-like"),
  },
  {
    id: "playlist",
    label: "Add to playlist",
    icon: PhListPlus,
    children: [
      { id: "pl-1", label: "Playlist 1" },
      { id: "pl-2", label: "Playlist 2" },
      { id: "pl-3", label: "Playlist 3" },
    ],
  },
  { id: "album", label: "Go to album", icon: PhDisc },
  { id: "artist", label: "Go to artist", icon: PhUser },
  { id: "share", label: "Share", icon: PhShareNetwork },
  { id: "report", label: "Report", icon: PhFlag },
]);
</script>

<template>
  <MenuResponsive v-model:open="open" :items="items">
    <template #trigger="slotProps">
      <slot name="trigger" v-bind="slotProps" />
    </template>
  </MenuResponsive>
</template>
