<script setup lang="ts">
/**
 * UiOtpField — ввод кода по ячейкам: ввод, backspace, вставка.
 */
const props = withDefaults(
  defineProps<{
    /** Число ячеек */
    length?: number;
    /** Неверный код — красная рамка */
    invalid?: boolean;
  }>(),
  {
    length: 4,
    invalid: false,
  },
);

const model = defineModel<string>({ default: "" });
const cells = ref<string[]>(
  Array.from({ length: props.length }, (_, index) => model.value[index] ?? ""),
);
const inputEls = ref<HTMLInputElement[]>([]);

/** Собираю модель из ячеек */
function syncModel(next: string[]) {
  cells.value = next;
  model.value = next.join("");
}

/** Ставлю цифру в ячейку и двигаю фокус вперёд */
function setDigit(index: number, digit: string) {
  const next = [...cells.value];
  next[index] = digit;
  syncModel(next);
  if (digit && index < props.length - 1) {
    inputEls.value[index + 1]?.focus();
  }
}

/** Ввод или автозаполнение сразу нескольких цифр */
function onInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const digits = target.value.replace(/\D/g, "");

  if (!digits) {
    const next = [...cells.value];
    next[index] = "";
    syncModel(next);
    return;
  }

  if (digits.length > 1) {
    fillFrom(index, digits);
    return;
  }

  setDigit(index, digits);
}

/** Backspace в пустой ячейке — к предыдущей */
function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === "Backspace" && !cells.value[index] && index > 0) {
    event.preventDefault();
    const next = [...cells.value];
    next[index - 1] = "";
    syncModel(next);
    inputEls.value[index - 1]?.focus();
    return;
  }

  if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    inputEls.value[index - 1]?.focus();
  }

  if (event.key === "ArrowRight" && index < props.length - 1) {
    event.preventDefault();
    inputEls.value[index + 1]?.focus();
  }
}

/** Вставка кода из буфера */
function onPaste(index: number, event: ClipboardEvent) {
  event.preventDefault();
  const digits = (event.clipboardData?.getData("text") ?? "").replace(
    /\D/g,
    "",
  );
  fillFrom(index, digits);
}

/** Раскладываю цифры начиная с ячейки index */
function fillFrom(index: number, digits: string) {
  const next = [...cells.value];
  const chars = digits.slice(0, props.length - index).split("");
  chars.forEach((char, offset) => {
    next[index + offset] = char;
  });
  syncModel(next);
  const focusAt = Math.min(index + chars.length, props.length - 1);
  inputEls.value[focusAt]?.focus();
}

onMounted(() => {
  inputEls.value[0]?.focus();
});

/** Фокус на первую ячейку */
function focus() {
  inputEls.value[0]?.focus();
}

defineExpose({ focus });
</script>

<template>
  <!-- OTP: ячейки кода -->
  <div class="flex justify-center gap-3">
    <input
      v-for="(digit, index) in cells"
      :key="index"
      :ref="
        (el) => {
          if (el) inputEls[index] = el as HTMLInputElement;
        }
      "
      :value="digit"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      :name="index === 0 ? 'code' : undefined"
      :aria-label="`Цифра ${index + 1} из ${props.length}`"
      class="box-border size-14 rounded-full border bg-primary-gray-dark text-center text-xl leading-none text-primary-white outline-none transition-colors"
      :class="
        props.invalid
          ? 'border-danger'
          : 'border-transparent focus:border-primary-white'
      "
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste(index, $event)"
      @focus="($event.target as HTMLInputElement).select()"
    />
  </div>
</template>
