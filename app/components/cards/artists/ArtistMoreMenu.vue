<script setup lang="ts">
/**
 * ArtistMoreMenu — artist “⋯” actions via MenuResponsive.
 * Trigger comes from #trigger slot (parent owns the button).
 */
import {
  PhFlag,
  PhHeart,
  PhPlay,
  PhShareNetwork,
  PhUser,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  isLiked: boolean;
}>();

const emit = defineEmits<{
  play: [];
  "toggle-like": [];
  "go-artist": [];
  share: [];
  report: [];
}>();

const items = computed<MenuItem[]>(() => [
  {
    id: "play",
    label: "Play",
    icon: PhPlay,
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
    id: "artist",
    label: "Go to artist",
    icon: PhUser,
    onClick: () => emit("go-artist"),
  },
  {
    id: "share",
    label: "Share",
    icon: PhShareNetwork,
    onClick: () => emit("share"),
  },
  {
    id: "report",
    label: "Report",
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
