<script setup lang="ts">
/**
 * UiEqualizerIcon — three bars “now playing” icon.
 * Animates only when `active`; otherwise static.
 */
const props = defineProps<{
  /** Animate bars (currently playing) */
  active?: boolean;
}>();
</script>

<template>
  <div class="flex items-center justify-center gap-0.5">
    <span
      class="eq-bar eq-bar-1 h-3 w-0.5 rounded-full bg-primary-white"
      :class="{ 'eq-bar-active': props.active }"
    />
    <span
      class="eq-bar eq-bar-2 h-3 w-0.5 rounded-full bg-primary-white"
      :class="{ 'eq-bar-active': props.active }"
    />
    <span
      class="eq-bar eq-bar-3 h-3 w-0.5 rounded-full bg-primary-white"
      :class="{ 'eq-bar-active': props.active }"
    />
  </div>
</template>

<style scoped>
.eq-bar {
  transform-origin: center bottom;
  transform: scaleY(0.7);
}

.eq-bar-active {
  animation: eq-scale 0.8s ease-in-out infinite;
}

.eq-bar-1.eq-bar-active {
  animation-delay: 0ms;
}

.eq-bar-2.eq-bar-active {
  animation-delay: 150ms;
}

.eq-bar-3.eq-bar-active {
  animation-delay: 300ms;
}

@keyframes eq-scale {
  0%,
  100% {
    transform: scaleY(0.45);
  }
  50% {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .eq-bar-active {
    animation: none;
    transform: scaleY(0.7);
  }
}
</style>
