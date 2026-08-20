<script setup lang="ts">
/**
 * Test — витрина UiButton: text / icon через пропсы.
 */
definePageMeta({
  layout: "app-layout",
});
</script>

<template>
  <div class="flex flex-col gap-10">
    <h1 class="text-2xl font-bold text-primary-white">Buttons</h1>

    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center gap-4">
        <span class="w-24 shrink-0 text-sm text-primary-gray">white</span>
        <UiButton text="Популярное" />
        <UiButton icon="UploadSimple" text="Загрузить" />
        <UiButton icon="Play" filled aria-label="Слушать" />
        <UiButton text="Популярное" disabled />
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <span class="w-24 shrink-0 text-sm text-primary-gray">gray</span>
        <UiButton variant="gray" text="Популярное" />
        <UiButton variant="gray" icon="UploadSimple" text="Загрузить" />
        <UiButton variant="gray" icon="Play" filled aria-label="Слушать" />
        <UiButton variant="gray" text="Популярное" disabled />
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <span class="w-24 shrink-0 text-sm text-primary-gray">ghost</span>
        <UiButton variant="ghost" text="Войти" />
        <UiButton variant="ghost" icon="ArrowLeft" text="Назад" />
        <UiButton variant="ghost" icon="Heart" aria-label="В избранное" />
        <UiButton variant="ghost" text="Войти" disabled />
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <span class="w-24 shrink-0 text-sm text-primary-gray">outline</span>
        <UiButton variant="outline" text="Фильтры" />
        <UiButton variant="outline" icon="UploadSimple" text="Загрузить" />
        <UiButton variant="outline" icon="Heart" aria-label="В избранное" />
        <UiButton
          variant="outline"
          icon="Heart"
          filled
          aria-label="В избранном"
        />
        <UiButton variant="outline" text="Фильтры" disabled />
      </div>
    </div>
  </div>
</template>
