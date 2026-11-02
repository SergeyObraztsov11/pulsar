<script setup lang="ts">
/**
 * PlaylistMoreMenu — действия плейлиста через MenuResponsive.
 * Триггер — слот #trigger (кнопку держит родитель).
 */
import {
  PhGear,
  PhPause,
  PhPlay,
  PhShareNetwork,
  PhTrash,
  PhUser,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  /** Плейлист сейчас играет в плеере */
  isPlaying?: boolean;
  /** Свои несистемные — «Настройки» / «Удалить» */
  canEdit?: boolean;
}>();

const emit = defineEmits<{
  play: [];
  settings: [];
  delete: [];
  "go-owner": [];
  share: [];
}>();

const items = computed<MenuItem[]>(() => {
  const list: MenuItem[] = [
    {
      id: "play",
      label: props.isPlaying ? "Пауза" : "Слушать",
      icon: props.isPlaying ? PhPause : PhPlay,
      onClick: () => emit("play"),
    },
  ];

  if (props.canEdit) {
    list.push({
      id: "settings",
      label: "Настройки",
      icon: PhGear,
      onClick: () => emit("settings"),
    });
  }

  list.push(
    {
      id: "owner",
      label: "Перейти к владельцу",
      icon: PhUser,
      onClick: () => emit("go-owner"),
    },
    {
      id: "share",
      label: "Поделиться",
      icon: PhShareNetwork,
      onClick: () => emit("share"),
    },
  );

  if (props.canEdit) {
    list.push({
      id: "delete",
      label: "Удалить плейлист",
      icon: PhTrash,
      iconClass: "text-danger",
      labelClass: "text-danger",
      onClick: () => emit("delete"),
    });
  }

  return list;
});
</script>

<template>
  <MenuResponsive v-model:open="open" :items="items">
    <template #trigger="slotProps">
      <slot name="trigger" v-bind="slotProps" />
    </template>
  </MenuResponsive>
</template>
