<template>
  <footer class="border-t border-primary-gray-dark pt-8 pb-2">
    <div
      class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <NuxtLink to="/register" class="text-primary-gray hover:underline">
          Регистрация
        </NuxtLink>
        <NuxtLink to="/login" class="text-primary-gray hover:underline">
          Войти
        </NuxtLink>
        <NuxtLink to="/search" class="text-primary-gray hover:underline">
          Поиск
        </NuxtLink>
        <NuxtLink to="/upload" class="text-primary-gray hover:underline">
          Загрузить
        </NuxtLink>
      </nav>
    </div>

    <p class="mt-6 text-sm text-primary-gray">
      © {{ new Date().getFullYear() }}. Все права защищены.
    </p>
  </footer>
</template>
