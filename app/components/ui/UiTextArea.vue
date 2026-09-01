<script setup lang="ts">
/**
 * UiTextArea — многострочное поле; подпись уезжает на рамку при фокусе или тексте.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Подпись: внутри в покое, на рамке при фокусе или тексте */
    placeholder?: string;
    /** Подсказка внутри, когда подпись на рамке и поле пустое */
    hint?: string;
    rows?: number;
  }>(),
  {
    placeholder: "",
    hint: "",
    rows: 4,
  },
);

const [model, modifiers] = defineModel<string>({ default: "" });
const textareaEl = useTemplateRef<HTMLTextAreaElement>("textareaEl");
const focused = ref(false);

/** Подпись на рамке: фокус или уже есть текст */
const isFloating = computed(
  () => focused.value || Boolean(model.value),
);

function onInput(event: Event) {
  model.value = (event.target as HTMLTextAreaElement).value;
}

function onChange(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  model.value = modifiers.trim ? value.trim() : value;
}

/** Фокус на textarea */
function focus() {
  textareaEl.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <!-- Textarea -->
  <div class="relative w-full bg-inherit">
    <div
      class="box-border w-full rounded-lg bg-primary-gray-light px-4 py-3 text-primary-white transition-[border-color,background-color] duration-200 motion-reduce:transition-none"
      :class="
        isFloating
          ? 'border border-primary-gray'
          : 'border border-transparent'
      "
    >
      <textarea
        ref="textareaEl"
        :value="model"
        :rows="props.rows"
        v-bind="$attrs"
        :placeholder="isFloating && !model ? props.hint || undefined : undefined"
        class="block w-full resize-none overflow-y-auto bg-transparent text-sm leading-relaxed text-primary-white outline-none placeholder:text-primary-gray [scrollbar-color:var(--color-primary-gray)_transparent] [scrollbar-width:thin]"
        :aria-label="props.placeholder || props.hint || undefined"
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
          ? 'top-0 left-4 -translate-y-1/2 px-1 text-xs text-primary-white'
          : 'top-3 left-4 text-sm text-primary-gray',
      ]"
    >
      <span
        v-if="isFloating"
        aria-hidden="true"
        class="absolute top-1/2 right-0 left-0 h-1.25 -translate-y-1/2 bg-inherit"
      />
      <span class="relative">{{ props.placeholder }}</span>
    </span>
  </div>
</template>
