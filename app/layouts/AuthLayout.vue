<template>
  <!-- Auth layout — без хедера; колонка main + AppFooter -->
  <div
    class="h-dvh overflow-x-hidden overflow-y-auto bg-primary-black text-primary-white [scrollbar-color:var(--color-primary-gray-dark)_transparent] [scrollbar-width:thin]"
  >
    <div
      class="mx-auto flex h-full min-h-full w-full max-w-5xl flex-col gap-10 px-4 py-6 sm:px-8 sm:py-8"
    >
      <main class="flex min-h-0 flex-1 flex-col justify-center">
        <slot />
      </main>

      <AppFooter />
    </div>
  </div>
</template>
