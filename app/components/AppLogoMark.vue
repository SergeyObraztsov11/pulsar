<script setup lang="ts">
/**
 * AppLogoMark — марк Pulsar: искра на орбите со спутником.
 * Красится через currentColor; размер задаётся классом снаружи.
 */
</script>

<template>
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <ellipse
      cx="32"
      cy="32"
      rx="26"
      ry="10"
      transform="rotate(-18 32 32)"
      stroke="currentColor"
      stroke-width="2"
    />
    <path
      d="M32 14C33.8 26 38 30.2 50 32 38 33.8 33.8 38 32 50 30.2 38 26 33.8 14 32 26 30.2 30.2 26 32 14Z"
      fill="currentColor"
    />
  </svg>
</template>
