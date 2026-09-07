/**
 * Unified API error codes (statusMessage in H3 JSON).
 * snake_case — machine-readable; UI text lives in app/utils/apiErrorMessage.ts.
 */
export const ApiErrorCode = {
  AUTHENTICATION_REQUIRED: "authentication_required",
  USER_NOT_FOUND: "user_not_found",
  INVALID_CREDENTIALS: "invalid_credentials",

  FORBIDDEN: "forbidden",
  PRIVATE_PLAYLIST: "private_playlist",

  ALBUM_NOT_FOUND: "album_not_found",
  ARTIST_NOT_FOUND: "artist_not_found",
  TRACK_NOT_FOUND: "track_not_found",
  PLAYLIST_NOT_FOUND: "playlist_not_found",
  MEDIA_NOT_FOUND: "media_not_found",

  EMAIL_ALREADY_REGISTERED: "email_already_registered",
  PAYLOAD_TOO_LARGE: "payload_too_large",
  RANGE_NOT_SATISFIABLE: "range_not_satisfiable",
  CODE_RATE_LIMITED: "code_rate_limited",

  EMAIL_PASSWORD_REQUIRED: "email_password_required",
  VERIFY_EMAIL_REQUIRED: "verify_email_required",
  REGISTRATION_FIELDS_INVALID: "registration_fields_invalid",
  NAME_TOO_LONG: "name_too_long",
  PASSWORD_TOO_SHORT: "password_too_short",
  CODE_REQUIRED: "code_required",
  CODE_EXPIRED_OR_INVALID: "code_expired_or_invalid",
  CODE_TOO_MANY_ATTEMPTS: "code_too_many_attempts",
  CODE_INVALID: "code_invalid",
  EMAIL_REQUIRED: "email_required",

  NAME_REQUIRED: "name_required",
  BIO_TOO_LONG: "bio_too_long",
  COUNTRY_TOO_LONG: "country_too_long",
  INVALID_BIRTH_DATE: "invalid_birth_date",
  INVALID_GENDER: "invalid_gender",
  NO_FIELDS_TO_UPDATE: "no_fields_to_update",
  AVATAR_FILE_REQUIRED: "avatar_file_required",
  AVATAR_TOO_LARGE: "avatar_too_large",
  AVATAR_MUST_BE_IMAGE: "avatar_must_be_image",
  LINKS_REQUIRED: "links_required",
  TOO_MANY_LINKS: "too_many_links",
  INVALID_LINK_KIND: "invalid_link_kind",
  DUPLICATE_LINK_KIND: "duplicate_link_kind",
  INVALID_LINK_URL: "invalid_link_url",

  ALBUM_ID_REQUIRED: "album_id_required",
  MULTIPART_FORM_REQUIRED: "multipart_form_required",
  ALBUM_NAME_REQUIRED: "album_name_required",
  ALBUM_NAME_TOO_LONG: "album_name_too_long",
  ALBUM_TRACKS_REQUIRED: "album_tracks_required",
  ALBUM_TRACKS_TOO_MANY: "album_tracks_too_many",
  ALBUM_COVER_TOO_LARGE: "album_cover_too_large",
  COVER_MUST_BE_IMAGE: "cover_must_be_image",
  ALBUM_TRACK_NAME_REQUIRED: "album_track_name_required",
  ALBUM_TRACK_NAME_TOO_LONG: "album_track_name_too_long",
  ALBUM_TRACK_AUDIO_REQUIRED: "album_track_audio_required",
  ALBUM_AUDIO_TOO_LARGE: "album_audio_too_large",
  AUDIO_INVALID: "audio_invalid",

  TRACK_ID_REQUIRED: "track_id_required",
  PLAYED_SEC_REQUIRED: "played_sec_required",
  LISTEN_THRESHOLD_NOT_MET: "listen_threshold_not_met",

  PLAYLIST_ID_REQUIRED: "playlist_id_required",
  PLAYLIST_NAME_REQUIRED: "playlist_name_required",
  PLAYLIST_DESCRIPTION_TOO_LONG: "playlist_description_too_long",
  PLAYLIST_COVER_TOO_LARGE: "playlist_cover_too_large",
  SYSTEM_PLAYLIST_NOT_EDITABLE: "system_playlist_not_editable",
  SYSTEM_PLAYLIST_NOT_DELETABLE: "system_playlist_not_deletable",
  PLAYLIST_TRACK_ID_REQUIRED: "playlist_track_id_required",
  PLAYLIST_TRACK_NOT_FOUND: "playlist_track_not_found",
  PLAYLIST_POSITION_INVALID: "playlist_position_invalid",
  PLAYLIST_IDS_REQUIRED: "playlist_ids_required",

  ARTIST_ID_REQUIRED: "artist_id_required",
  INVALID_MEDIA_KEY: "invalid_media_key",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
