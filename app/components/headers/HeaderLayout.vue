<script setup lang="ts">
/**
 * HeaderLayout — sticky chrome frame: solid on scroll.
 * Concrete headers fill the default slot.
 */
const route = useRoute();
const headerEl = ref<HTMLElement | null>(null);
const solid = ref(false);

function findScrollRoot(from: HTMLElement | null): HTMLElement | null {
  let el = from?.parentElement ?? null;
  while (el) {
    const overflowY = getComputedStyle(el).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

let scrollRoot: HTMLElement | null = null;

function syncSolid() {
  if (!scrollRoot) return;
  solid.value = scrollRoot.scrollTop > 0;
}

function bindScroll() {
  scrollRoot?.removeEventListener("scroll", syncSolid);
  scrollRoot = findScrollRoot(headerEl.value);
  scrollRoot?.addEventListener("scroll", syncSolid, { passive: true });
  syncSolid();
}

watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      if (scrollRoot) scrollRoot.scrollTop = 0;
      bindScroll();
    });
  },
);

onMounted(() => {
  nextTick(() => bindScroll());
});

onBeforeUnmount(() => {
  scrollRoot?.removeEventListener("scroll", syncSolid);
});

const headerClass = computed(() => [
  "sticky top-0 z-50",
  solid.value ? "bg-primary-black" : "bg-transparent",
]);

/** Бордер — на контентной ширине, не на всю страницу */
const bandClass = computed(() => [
  "flex h-16 w-full items-center border-b",
  solid.value ? "border-primary-gray-dark" : "border-transparent",
]);
</script>

<template>
  <header ref="headerEl" class="sticky top-0 z-50 bg-transparent">
    <!-- Header band -->
    <div class="mx-auto w-full max-w-5xl px-8 ">
      <div :class="bandClass">
        <slot />
      </div>
    </div>
  </header>
</template>
