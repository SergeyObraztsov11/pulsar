<script setup lang="ts">
/**
 * AppAudioHost — единственный <audio> приложения.
 * Синхронизирует DOM с playerStore; смена трека — явный load; ended после skip игнорируем.
 * Учёт прослушиваний — рядом с audio (useTrackListen), без отдельного plugin.
 */
import { toMediaSrc } from "~/utils/mediaSrc";

const playerStore = usePlayerStore();
const audioEl = useTemplateRef<HTMLAudioElement>("audioEl");

/** Один раз на lifetime audio-host: порог → POST /api/tracks/:id/listen */
useTrackListen();

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
  <!-- Скрытый <audio>: в layout, чтобы не размонтироваться при смене chrome плеера -->
  <audio
    ref="audioEl"
    class="pointer-events-none hidden"
    preload="auto"
    tabindex="-1"
    @canplay="onCanPlay"
    @playing="onPlaying"
    @loadedmetadata="onLoadedMetadata"
    @timeupdate="onTimeUpdate"
    @ended="onEnded"
  />

</template>
