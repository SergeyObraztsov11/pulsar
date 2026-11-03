<script setup lang="ts">
/**
 * Треклист плейлиста.
 * DnD-режим снаружи (v-model:dndMode): карточка как есть, pointer глушим, тянем строку.
 */
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";
import { playerQueueKey } from "~/composables/useTrackCard";

const props = defineProps<{
  playlistId: string;
  /** Текущий вид списка (с учётом сортировки). */
  tracks: Track[];
  /**
   * Канонический порядок плейлиста (добавление / DnD).
   * Номера на карточках всегда из него, не из визуальной сортировки.
   */
  orderTracks: Track[];
  /** Режим перестановки (кнопка в шапке страницы). */
  dndMode?: boolean;
  queueSource?: PlayerQueueSource | null;
}>();

const emit = defineEmits<{
  "update:tracks": [tracks: Track[]];
}>();

const list = ref<Track[]>([]);
const pending = ref(false);

/** Позиция в каноническом порядке (1-based); в DnD — из текущего list. */
function orderNumber(trackId: string) {
  const source = props.dndMode ? list.value : props.orderTracks;
  const i = source.findIndex((t) => t.id === trackId);
  return i >= 0 ? i + 1 : 0;
}

watch(
  () => [props.tracks, props.dndMode, props.orderTracks] as const,
  () => {
    // В DnD всегда канонический порядок; иначе — текущая сортировка
    const source = props.dndMode ? props.orderTracks : props.tracks;
    list.value = [...source];
  },
  { immediate: true },
);

provide(playerQueueKey, {
  tracks: computed(() => list.value),
  source: computed(() => props.queueSource ?? null),
});

const fromIndex = ref<number | null>(null);
const insertBefore = ref<number | null>(null);
/** Временный ghost у курсора (только название). */
let dragGhost: HTMLElement | null = null;

function resetDrag() {
  fromIndex.value = null;
  insertBefore.value = null;
  dragGhost?.remove();
  dragGhost = null;
}

watch(
  () => props.dndMode,
  (on) => {
    if (!on) resetDrag();
  },
);

/** Превью у курсора — название трека, не вся карточка. */
function setNameDragImage(e: DragEvent, name: string) {
  dragGhost?.remove();
  const ghost = document.createElement("div");
  ghost.textContent = name;
  ghost.style.cssText = [
    "position: fixed",
    "top: -9999px",
    "left: 0",
    "padding: 8px 12px",
    "border-radius: 6px",
    "background: var(--color-tone-surface, #282828)",
    "color: var(--color-tone-white, #fff)",
    "font: 500 14px/1.25 Onest, sans-serif",
    "white-space: nowrap",
    "pointer-events: none",
    "z-index: 9999",
  ].join(";");
  document.body.appendChild(ghost);
  dragGhost = ghost;
  e.dataTransfer?.setDragImage(ghost, 12, 14);
}

function onDragStart(e: DragEvent, index: number) {
  if (!props.dndMode) {
    e.preventDefault();
    return;
  }
  fromIndex.value = index;
  const name = list.value[index]?.name ?? "Трек";
  e.dataTransfer?.setData("text/plain", name);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  setNameDragImage(e, name);
}

function onDragOver(e: DragEvent, index: number) {
  if (!props.dndMode || fromIndex.value == null) return;
  e.preventDefault();
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  insertBefore.value = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
}

async function onDrop(e: DragEvent) {
  e.preventDefault();
  if (!props.dndMode) return;

  const from = fromIndex.value;
  const before = insertBefore.value;
  resetDrag();
  if (from == null || before == null || pending.value) return;

  const to = before > from ? before - 1 : before;
  if (to === from) return;

  const prev = list.value;
  const next = [...prev];
  const [moved] = next.splice(from, 1);
  if (!moved) return;

  next.splice(to, 0, moved);
  list.value = next;
  emit("update:tracks", next);

  pending.value = true;
  try {
    await $fetch(`/api/playlists/${props.playlistId}/tracks`, {
      method: "PATCH",
      body: { trackId: moved.id, toPosition: to },
    });
  } catch {
    list.value = prev;
    emit("update:tracks", prev);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="flex w-full flex-col gap-1" @dragover.prevent @drop="onDrop">
    <div
      v-for="(track, index) in list"
      :key="track.id"
      class="relative"
      :draggable="dndMode"
      :class="[
        dndMode
          ? 'cursor-grab active:cursor-grabbing hover:bg-tone-surface animate-dnd-jiggle'
          : undefined,
        fromIndex === index ? 'opacity-40' : undefined,
      ]"
      :style="
        dndMode ? { animationDelay: `${(index % 5) * 40}ms` } : undefined
      "
      @dragstart="onDragStart($event, index)"
      @dragend="resetDrag"
      @dragover="onDragOver($event, index)"
    >
      <div
        v-show="dndMode && fromIndex != null && insertBefore === index"
        class="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 -translate-y-1/2 bg-tone-white"
        aria-hidden="true"
      />

      <div :class="dndMode ? 'pointer-events-none' : undefined">
          <TrackIndexCoverCard :track="track" :index="orderNumber(track.id)" />
      </div>
    </div>

    <div
      v-show="dndMode && fromIndex != null && insertBefore === list.length"
      class="pointer-events-none h-0.5 w-full bg-tone-white"
      aria-hidden="true"
    />
  </div>
</template>
