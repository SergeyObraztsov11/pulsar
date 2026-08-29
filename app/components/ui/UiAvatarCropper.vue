<script setup lang="ts">
/**
 * UiAvatarCropper — круглый кадр: масштаб (колёсико) и сдвиг (drag).
 * getCroppedFile() → JPEG квадрат для загрузки.
 */
const props = withDefaults(
  defineProps<{
    /** Object URL или http(s) картинки */
    src: string;
    /** Размер области кадрирования (px) */
    size?: number;
    /** Размер выходного JPEG */
    outputSize?: number;
  }>(),
  {
    size: 280,
    outputSize: 512,
  },
);

const imageEl = ref<HTMLImageElement | null>(null);

const naturalW = ref(0);
const naturalH = ref(0);
const ready = ref(false);

/** Множитель поверх cover (1 = картинка ровно закрывает круг) */
const zoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

const dragging = ref(false);
const dragStart = ref({ x: 0, y: 0, ox: 0, oy: 0 });

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/** Масштаб cover: картинка полностью закрывает круг */
const baseScale = computed(() => {
  if (!naturalW.value || !naturalH.value) return 1;
  return Math.max(props.size / naturalW.value, props.size / naturalH.value);
});

const scale = computed(() => baseScale.value * zoom.value);

const displayW = computed(() => naturalW.value * scale.value);
const displayH = computed(() => naturalH.value * scale.value);

const offsetLimits = computed(() => {
  const maxX = Math.max(0, (displayW.value - props.size) / 2);
  const maxY = Math.max(0, (displayH.value - props.size) / 2);
  return { minX: -maxX, maxX, minY: -maxY, maxY };
});

const imageStyle = computed(() => {
  if (!ready.value || !naturalW.value) {
    return { opacity: "0" };
  }
  return {
    width: `${displayW.value}px`,
    height: `${displayH.value}px`,
    left: `${props.size / 2 + offsetX.value - displayW.value / 2}px`,
    top: `${props.size / 2 + offsetY.value - displayH.value / 2}px`,
    opacity: "1",
  };
});

function clampOffsets() {
  const { minX, maxX, minY, maxY } = offsetLimits.value;
  offsetX.value = Math.min(maxX, Math.max(minX, offsetX.value));
  offsetY.value = Math.min(maxY, Math.max(minY, offsetY.value));
}

function resetTransform() {
  zoom.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

function applyImageSize(img: HTMLImageElement) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  naturalW.value = img.naturalWidth;
  naturalH.value = img.naturalHeight;
  resetTransform();
  ready.value = true;
  nextTick(() => clampOffsets());
}

function onImageLoad() {
  const img = imageEl.value;
  if (!img) return;
  applyImageSize(img);
}

function onImageError() {
  ready.value = false;
  naturalW.value = 0;
  naturalH.value = 0;
}

watch(
  () => props.src,
  async () => {
    ready.value = false;
    naturalW.value = 0;
    naturalH.value = 0;
    resetTransform();
    await nextTick();
    const img = imageEl.value;
    // Кеш / синхронная готовность — @load мог не сработать
    if (img?.complete && img.naturalWidth) {
      applyImageSize(img);
    }
  },
);

watch([zoom, displayW, displayH], () => {
  if (ready.value) clampOffsets();
});

onMounted(() => {
  const img = imageEl.value;
  if (img?.complete && img.naturalWidth) {
    applyImageSize(img);
  }
});

function onPointerDown(event: PointerEvent) {
  if (!ready.value) return;
  dragging.value = true;
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    ox: offsetX.value,
    oy: offsetY.value,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return;
  offsetX.value = dragStart.value.ox + (event.clientX - dragStart.value.x);
  offsetY.value = dragStart.value.oy + (event.clientY - dragStart.value.y);
  clampOffsets();
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  try {
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  } catch {
    // already released
  }
}

function onWheel(event: WheelEvent) {
  if (!ready.value) return;
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.08 : 0.08;
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value + delta));
}

/** JPEG-файл кадрированной области */
async function getCroppedFile(filename = "avatar.jpg") {
  const img = imageEl.value;
  if (!img || !ready.value) {
    throw new Error("image is not ready");
  }

  const out = props.outputSize;
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const left = props.size / 2 + offsetX.value - displayW.value / 2;
  const top = props.size / 2 + offsetY.value - displayH.value / 2;
  const sx = (0 - left) / scale.value;
  const sy = (0 - top) / scale.value;
  const sw = props.size / scale.value;
  const sh = props.size / scale.value;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out, out);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) resolve(value);
        else reject(new Error("failed to encode jpeg"));
      },
      "image/jpeg",
      0.9,
    );
  });

  return new File([blob], filename, { type: "image/jpeg" });
}

defineExpose({ getCroppedFile, resetTransform });
</script>

<template>
  <div class="flex w-full flex-col items-center gap-3">
    <!-- Круглый вьюпорт -->
    <div
      class="relative touch-none overflow-hidden rounded-full bg-primary-black select-none"
      :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
      :style="{ width: `${size}px`, height: `${size}px` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheel"
    >
      <img
        ref="imageEl"
        :src="src"
        alt=""
        draggable="false"
        class="pointer-events-none absolute max-w-none"
        :style="imageStyle"
        @load="onImageLoad"
        @error="onImageError"
      />
      <div
        class="pointer-events-none absolute inset-0 rounded-full ring-1 ring-primary-gray"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
