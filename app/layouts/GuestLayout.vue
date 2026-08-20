<template>
  <!-- Guest layout — sticky GuestHeader; колонка main + AppFooter -->
  <div
    class="h-dvh overflow-x-hidden overflow-y-auto bg-primary-black text-primary-white [scrollbar-color:var(--color-primary-gray-dark)_transparent] [scrollbar-width:thin]"
  >
    <GuestHeader />

    <div
      class="mx-auto flex min-h-[calc(100%-5.5rem)] w-full max-w-5xl flex-col gap-10 px-8 pb-8"
    >
      <main class="flex flex-1 flex-col">
        <slot />
      </main>

      <AppFooter />
    </div>
  </div>
</template>
