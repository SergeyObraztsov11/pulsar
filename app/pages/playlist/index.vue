<script setup lang="ts">
/**
 * Редirect /playlist → /user/:id/playlist (legacy shortcut).
 */
import { ApiErrorCode } from "#shared/apiErrorCodes";
import { playlistsPath } from "~/utils/catalogPaths";

const { user } = useUserSession();

if (!user.value?.id) {
  throw createError({
    statusCode: 401,
    statusMessage: ApiErrorCode.AUTHENTICATION_REQUIRED,
    fatal: true,
  });
}

await navigateTo(playlistsPath(user.value.id), { replace: true });
</script>

<template>
  <div />
</template>
