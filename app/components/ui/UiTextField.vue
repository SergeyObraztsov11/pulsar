<script setup lang="ts">
/**
 * UiTextField — однострочное поле; плейсхолдер уезжает на рамку.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    type?: string;
    /** Выравнивание текста в поле */
    align?: "start" | "center";
    placeholder?: string;
  }>(),
  {
    type: "text",
    align: "start",
    placeholder: "",
  },
);

const [model, modifiers] = defineModel<string>({ default: "" });
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");
const focused = ref(false);

/** Плейсхолдер на рамке: фокус или уже есть текст */
const isFloating = computed(
  () => focused.value || Boolean(model.value),
);

/** Ввод: trim только по модификатору, на change как у нативного v-model.trim */
function onInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value;
}

function onChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  model.value = modifiers.trim ? value.trim() : value;
}

/** Фокус на input */
function focus() {
  inputEl.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <!-- Text field -->
  <div class="relative w-full">
    <div
      class="flex h-10 w-full box-border items-center rounded-full border bg-primary-gray-dark px-4 leading-none text-primary-white transition-colors"
      :class="isFloating ? 'border-primary-white' : 'border-transparent'"
    >
      <input
        ref="inputEl"
        :value="model"
        :type="props.type"
        v-bind="$attrs"
        class="min-w-0 flex-1 bg-transparent leading-none outline-none"
        :class="{ 'text-center': props.align === 'center' }"
        :aria-label="props.placeholder || undefined"
        @input="onInput"
        @change="onChange"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>

    <span
      v-if="props.placeholder"
      class="pointer-events-none absolute z-10 origin-left leading-none transition-all duration-200 motion-reduce:transition-none"
      :class="[
        isFloating
          ? 'top-0 left-4 -translate-y-1/2 px-1 text-xs'
          : props.align === 'center'
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'top-1/2 left-4 -translate-y-1/2',
        isFloating ? 'text-primary-white' : 'text-primary-gray',
      ]"
    >
      <!-- Перекрывает рамку по центру подписи, текст поверх -->
      <span
        v-if="isFloating"
        aria-hidden="true"
        class="absolute top-1/2 right-0 left-0 h-[5px] -translate-y-1/2 bg-primary-black"
      />
      <span class="relative">{{ props.placeholder }}</span>
    </span>
  </div>
</template>
