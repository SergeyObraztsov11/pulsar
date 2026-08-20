<script setup lang="ts">
/**
 * AppPlayerHost — единственный <audio> приложения.
 * Смена трека: явный load; ended после skip игнорируем.
 */
import { toMediaSrc } from "~/utils/mediaSrc";

const playerStore = usePlayerStore();
const audioEl = useTemplateRef<HTMLAudioElement>("audioEl");

const src = computed(
  () => toMediaSrc(playerStore.current?.audioSrc) ?? "",
);

/** После next/prev браузер шлёт ended со старого файла */
let ignoreEnded = false;

/** AbortError при смене src — норма */
function tryPlay() {
  const el = audioEl.value;
  if (!el || !playerStore.isPlaying || !src.value) return;
  void el.play().catch(() => {});
}

function applyVolume() {
  const el = audioEl.value;
  if (!el) return;
  el.volume = playerStore.isVolumeMuted ? 0 : playerStore.volume;
}

function applySeek() {
  const el = audioEl.value;
  if (!el || playerStore.seekAt == null) return;
  el.currentTime = playerStore.seekAt;
  playerStore.seekAt = null;
  playerStore.isScrubbing = false;
}

watch(
  () => playerStore.isPlaying,
  (wantPlay) => {
    const el = audioEl.value;
    if (!el) return;
    if (wantPlay) tryPlay();
    else el.pause();
  },
);

watch(
  () => [playerStore.volume, playerStore.isVolumeMuted] as const,
  () => applyVolume(),
  { immediate: true },
);

watch(
  () => playerStore.current?.id,
  (id, prevId) => {
    const el = audioEl.value;
    if (!el || id === prevId) return;
    ignoreEnded = true;
    if (!src.value) {
      el.removeAttribute("src");
      el.load();
      return;
    }
    const nextSrc = src.value;
    const already =
      el.currentSrc.endsWith(nextSrc) || el.getAttribute("src") === nextSrc;
    if (already) {
      tryPlay();
      return;
    }
    el.src = nextSrc;
    el.load();
    applyVolume();
    tryPlay();
  },
);

watch(
  () => playerStore.seekAt,
  () => applySeek(),
);

function onCanPlay() {
  applyVolume();
  tryPlay();
}

function onPlaying() {
  ignoreEnded = false;
}

function onLoadedMetadata() {
  const el = audioEl.value;
  if (!el) return;
  playerStore.setDuration(el.duration);
}

function onTimeUpdate() {
  const el = audioEl.value;
  if (!el || playerStore.isScrubbing) return;
  playerStore.setCurrentTime(el.currentTime);
}

function onEnded() {
  if (ignoreEnded) {
    ignoreEnded = false;
    return;
  }
  playerStore.next();
}
</script>

<template>
  <!-- Скрытый движок: не в мини-плеере, чтобы не размонтироваться -->
  <audio
    ref="audioEl"
    class="pointer-events-none absolute size-px overflow-hidden opacity-0"
    preload="auto"
    tabindex="-1"
    @canplay="onCanPlay"
    @playing="onPlaying"
    @loadedmetadata="onLoadedMetadata"
    @timeupdate="onTimeUpdate"
    @ended="onEnded"
  />
</template>
