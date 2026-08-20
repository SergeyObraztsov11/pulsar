<script setup lang="ts">
/**
 * RegisterStepName — шаг имени.
 */
const name = defineModel<string>({ default: "" });
</script>

<template>
  <UiTextField
    v-model.trim="name"
    type="text"
    name="name"
    autocomplete="name"
    autofocus
    maxlength="50"
    placeholder="Имя"
  />
</template>
