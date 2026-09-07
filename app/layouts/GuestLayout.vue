<template>
  <!-- Guest layout — full-bleed shell для лендинга -->
  <div
    class="h-dvh overflow-x-hidden overflow-y-auto bg-tone-shell text-tone-white [scrollbar-color:var(--color-tone-muted)_transparent] [scrollbar-width:thin]"
  >
    <div class="sticky top-0 z-50 bg-tone-shell/80 backdrop-blur-md">
      <GuestHeader />
    </div>

    <main class="flex w-full flex-1 flex-col">
      <slot />
    </main>

    <div class="mx-auto w-full max-w-5xl px-4 pb-8 pt-10 lg:px-6">
      <AppFooter />
    </div>
  </div>
</template>
