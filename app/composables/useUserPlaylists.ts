import type { MaybeRefOrGetter } from "vue";
import type { PlaylistSummary } from "~/types/playlist";

/**
 * User playlists list + track membership helpers.
 */
export function useUserPlaylists(trackId: MaybeRefOrGetter<string | undefined>) {
  const trackIdRef = computed(() => toValue(trackId)?.trim() ?? "");

  const playlists = ref<PlaylistSummary[]>([]);
  const pending = ref(false);
  const error = ref<unknown>(null);

  async function refresh() {
    const id = trackIdRef.value;
    if (!id) {
      playlists.value = [];
      return;
    }

    pending.value = true;
    error.value = null;
    try {
      playlists.value = await $fetch<PlaylistSummary[]>(
        `/api/playlists?trackId=${encodeURIComponent(id)}`,
      );
    } catch (err) {
      error.value = err;
      playlists.value = [];
    } finally {
      pending.value = false;
    }
  }

  async function addTrackToPlaylist(playlistId: string, id: string) {
    return $fetch<{ ok: boolean; added: boolean }>(
      `/api/playlists/${playlistId}/tracks`,
      { method: "POST", body: { trackId: id } },
    );
  }

  async function removeTrackFromPlaylist(playlistId: string, id: string) {
    return $fetch<{ ok: boolean; removed: boolean }>(
      `/api/playlists/${playlistId}/tracks/${id}`,
      { method: "DELETE" },
    );
  }

  async function createPlaylist(name: string) {
    return $fetch<PlaylistSummary>("/api/playlists", {
      method: "POST",
      body: { name },
    });
  }

  return {
    playlists,
    pending,
    error,
    refresh,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    createPlaylist,
  };
}
