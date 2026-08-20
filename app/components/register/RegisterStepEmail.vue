<script setup lang="ts">
/**
 * RegisterStepEmail — шаг email.
 */
const email = defineModel<string>({ default: "" });
</script>

<template>
  <UiTextField
    v-model.trim="email"
    type="email"
    name="email"
    autocomplete="email"
    autofocus
    placeholder="Email"
  />
</template>
