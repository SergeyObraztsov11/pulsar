<script setup lang="ts">
/**
 * UiTextField — однострочное поле; подпись уезжает на рамку при фокусе или тексте.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    type?: string;
    /** Выравнивание текста в поле */
    align?: "start" | "center";
    /** Подпись: внутри в покое, на рамке при фокусе или тексте */
    placeholder?: string;
    /** Подсказка внутри, когда подпись на рамке и поле пустое */
    hint?: string;
  }>(),
  {
    type: "text",
    align: "start",
    placeholder: "",
    hint: "",
  },
);

const [model, modifiers] = defineModel<string>({ default: "" });
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");
const focused = ref(false);

/** Подпись на рамке: фокус или уже есть текст */
const isFloating = computed(() => focused.value || Boolean(model.value));

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
  <div class="relative w-full bg-inherit">
    <div
      class="box-border flex h-11 w-full items-center rounded-md border bg-tone-surface px-4 leading-none transition-[border-color] duration-200 motion-reduce:transition-none"
      :class="
        isFloating ? 'border-tone-surface-hover' : 'border-transparent'
      "
    >
      <input
        ref="inputEl"
        :value="model"
        :type="props.type"
        v-bind="$attrs"
        :placeholder="
          isFloating && !model ? props.hint || undefined : undefined
        "
        class="min-w-0 flex-1 bg-transparent text-base leading-none text-tone-white outline-none placeholder:text-tone-muted"
        :class="{ 'text-center': props.align === 'center' }"
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
          ? 'top-0 left-4 -translate-y-1/2 px-1 text-xs text-tone-white'
          : props.align === 'center'
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-tone-muted'
            : 'top-1/2 left-4 -translate-y-1/2 text-sm text-tone-muted',
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
