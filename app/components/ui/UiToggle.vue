<script setup lang="ts">
/**
 * UiToggle — pill-переключатель с v-model.
 */
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    /** Для screen readers, если нет видимой подписи рядом */
    ariaLabel?: string;
  }>(),
  {
    disabled: false,
  },
);

const model = defineModel<boolean>({ default: false });

function onToggle() {
  if (props.disabled) return;
  model.value = !model.value;
}
</script>

<template>
  <button
    type="button"
    role="switch"
    class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
    :class="model ? 'bg-primary-white' : 'bg-primary-gray-dark'"
    :aria-checked="model"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="onToggle"
  >
    <span
      class="absolute top-1 size-5 rounded-full bg-primary-black transition-[left] duration-300 motion-reduce:transition-none"
      :class="model ? 'left-6' : 'left-1'"
    />
  </button>
</template>
