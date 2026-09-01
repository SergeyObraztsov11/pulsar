import type { PlaylistSummary } from "~/types/playlist";
import { fetchErrorMessage } from "~/utils/apiErrorMessage";

export type PlaylistSettingsPatch = {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
};

/**
 * usePlaylistSettings — PATCH meta and cover for user playlist.
 */
export function usePlaylistSettings(playlistId: string) {
  async function updatePlaylist(patch: PlaylistSettingsPatch) {
    return $fetch<PlaylistSummary>(`/api/playlists/${playlistId}`, {
      method: "PATCH",
      body: patch,
    });
  }

  async function uploadCover(file: File) {
    const form = new FormData();
    form.append("cover", file);
    return $fetch<PlaylistSummary>(`/api/playlists/${playlistId}/cover`, {
      method: "POST",
      body: form,
    });
  }

  async function removeCover() {
    return $fetch<PlaylistSummary>(`/api/playlists/${playlistId}/cover`, {
      method: "DELETE",
    });
  }

  async function savePlaylistSettings(input: {
    patch?: PlaylistSettingsPatch;
    coverFile?: File | null;
    removeCover?: boolean;
  }) {
    let result: PlaylistSummary | undefined;

    if (input.patch && Object.keys(input.patch).length > 0) {
      result = await updatePlaylist(input.patch);
    }

    if (input.removeCover) {
      result = await removeCover();
    } else if (input.coverFile) {
      result = await uploadCover(input.coverFile);
    }

    return result;
  }

  return {
    updatePlaylist,
    uploadCover,
    removeCover,
    savePlaylistSettings,
    fetchErrorMessage,
  };
}
