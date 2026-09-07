/**
 * Map API error codes (statusMessage) to user-facing Russian text.
 */
import { ApiErrorCode, type ApiErrorCode as ApiErrorCodeType } from "#shared/apiErrorCodes";

const messages: Record<ApiErrorCodeType, string> = {
  [ApiErrorCode.AUTHENTICATION_REQUIRED]: "Войдите в аккаунт.",
  [ApiErrorCode.USER_NOT_FOUND]: "Пользователь не найден.",
  [ApiErrorCode.INVALID_CREDENTIALS]: "Неверный email или пароль.",

  [ApiErrorCode.FORBIDDEN]: "Нет доступа.",
  [ApiErrorCode.PRIVATE_PLAYLIST]: "Плейлист недоступен.",

  [ApiErrorCode.ALBUM_NOT_FOUND]: "Альбом не найден.",
  [ApiErrorCode.ARTIST_NOT_FOUND]: "Артист не найден.",
  [ApiErrorCode.TRACK_NOT_FOUND]: "Трек не найден.",
  [ApiErrorCode.PLAYLIST_NOT_FOUND]: "Плейлист не найден.",
  [ApiErrorCode.MEDIA_NOT_FOUND]: "Файл не найден.",

  [ApiErrorCode.EMAIL_ALREADY_REGISTERED]: "Этот email уже зарегистрирован.",
  [ApiErrorCode.PAYLOAD_TOO_LARGE]: "Файлы слишком большие.",
  [ApiErrorCode.RANGE_NOT_SATISFIABLE]: "Некорректный диапазон.",
  [ApiErrorCode.CODE_RATE_LIMITED]: "Код уже отправлен. Подождите минуту.",

  [ApiErrorCode.EMAIL_PASSWORD_REQUIRED]: "Укажите email и пароль.",
  [ApiErrorCode.VERIFY_EMAIL_REQUIRED]: "Подтвердите email кодом из письма.",
  [ApiErrorCode.REGISTRATION_FIELDS_INVALID]:
    "Проверьте имя, дату рождения, пол, email и пароль.",
  [ApiErrorCode.NAME_TOO_LONG]: "Имя слишком длинное.",
  [ApiErrorCode.PASSWORD_TOO_SHORT]: "Пароль должен быть не короче 8 символов.",
  [ApiErrorCode.CODE_REQUIRED]: "Введите код из письма.",
  [ApiErrorCode.CODE_EXPIRED_OR_INVALID]:
    "Код неверный или срок истёк. Запросите новый.",
  [ApiErrorCode.CODE_TOO_MANY_ATTEMPTS]:
    "Слишком много попыток. Запросите код снова.",
  [ApiErrorCode.CODE_INVALID]: "Неверный код.",
  [ApiErrorCode.EMAIL_REQUIRED]: "Укажите email.",

  [ApiErrorCode.NAME_REQUIRED]: "Укажите имя.",
  [ApiErrorCode.BIO_TOO_LONG]: "Описание слишком длинное.",
  [ApiErrorCode.COUNTRY_TOO_LONG]: "Страна слишком длинная.",
  [ApiErrorCode.INVALID_BIRTH_DATE]: "Некорректная дата рождения.",
  [ApiErrorCode.INVALID_GENDER]: "Некорректный пол.",
  [ApiErrorCode.NO_FIELDS_TO_UPDATE]: "Нет полей для обновления.",
  [ApiErrorCode.AVATAR_FILE_REQUIRED]: "Выберите файл аватара.",
  [ApiErrorCode.AVATAR_TOO_LARGE]: "Аватар слишком большой.",
  [ApiErrorCode.AVATAR_MUST_BE_IMAGE]: "Аватар должен быть изображением.",
  [ApiErrorCode.LINKS_REQUIRED]: "Укажите ссылки.",
  [ApiErrorCode.TOO_MANY_LINKS]: "Слишком много ссылок.",
  [ApiErrorCode.INVALID_LINK_KIND]: "Недопустимый тип ссылки.",
  [ApiErrorCode.DUPLICATE_LINK_KIND]: "Ссылка этого типа уже добавлена.",
  [ApiErrorCode.INVALID_LINK_URL]: "Некорректная ссылка.",

  [ApiErrorCode.ALBUM_ID_REQUIRED]: "Не указан альбом.",
  [ApiErrorCode.MULTIPART_FORM_REQUIRED]: "Некорректная форма загрузки.",
  [ApiErrorCode.ALBUM_NAME_REQUIRED]: "Укажите название альбома.",
  [ApiErrorCode.ALBUM_NAME_TOO_LONG]: "Название альбома слишком длинное.",
  [ApiErrorCode.ALBUM_TRACKS_REQUIRED]: "Добавьте хотя бы один трек.",
  [ApiErrorCode.ALBUM_TRACKS_TOO_MANY]: "Слишком много треков.",
  [ApiErrorCode.ALBUM_COVER_TOO_LARGE]: "Обложка слишком большая.",
  [ApiErrorCode.COVER_MUST_BE_IMAGE]: "Обложка должна быть изображением.",
  [ApiErrorCode.ALBUM_TRACK_NAME_REQUIRED]: "У каждого трека должно быть название.",
  [ApiErrorCode.ALBUM_TRACK_NAME_TOO_LONG]: "Название трека слишком длинное.",
  [ApiErrorCode.ALBUM_TRACK_AUDIO_REQUIRED]: "У каждого трека должен быть аудиофайл.",
  [ApiErrorCode.ALBUM_AUDIO_TOO_LARGE]: "Аудиофайл слишком большой.",
  [ApiErrorCode.AUDIO_INVALID]: "Некорректный аудиофайл.",

  [ApiErrorCode.TRACK_ID_REQUIRED]: "Не указан трек.",
  [ApiErrorCode.PLAYED_SEC_REQUIRED]: "Не указана длительность прослушивания.",
  [ApiErrorCode.LISTEN_THRESHOLD_NOT_MET]: "Прослушивание слишком короткое.",

  [ApiErrorCode.PLAYLIST_ID_REQUIRED]: "Не указан плейлист.",
  [ApiErrorCode.PLAYLIST_NAME_REQUIRED]: "Укажите название плейлиста.",
  [ApiErrorCode.PLAYLIST_DESCRIPTION_TOO_LONG]: "Описание слишком длинное.",
  [ApiErrorCode.PLAYLIST_COVER_TOO_LARGE]: "Обложка слишком большая.",
  [ApiErrorCode.SYSTEM_PLAYLIST_NOT_EDITABLE]:
    "Системный плейлист нельзя редактировать.",
  [ApiErrorCode.SYSTEM_PLAYLIST_NOT_DELETABLE]:
    "Системный плейлист нельзя удалить.",
  [ApiErrorCode.PLAYLIST_TRACK_ID_REQUIRED]: "Не указан трек.",
  [ApiErrorCode.PLAYLIST_TRACK_NOT_FOUND]: "Трека нет в этом плейлисте.",
  [ApiErrorCode.PLAYLIST_POSITION_INVALID]: "Некорректная позиция трека.",
  [ApiErrorCode.PLAYLIST_IDS_REQUIRED]: "Не указан плейлист или трек.",

  [ApiErrorCode.ARTIST_ID_REQUIRED]: "Не указан артист.",
  [ApiErrorCode.INVALID_MEDIA_KEY]: "Некорректный ключ медиа.",
};

/** Resolve user-facing message from API error code */
export function apiErrorMessage(
  code: string | undefined | null,
  fallback = "Не получилось. Попробуйте ещё раз.",
): string {
  if (!code) return fallback;
  if (code in messages) {
    return messages[code as ApiErrorCodeType];
  }
  return fallback;
}

/** Read statusMessage from ofetch / useFetch error */
export function readApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const err = error as {
    statusMessage?: string;
    data?: { statusMessage?: string };
  };
  return err.data?.statusMessage ?? err.statusMessage;
}

/** User-facing text from fetch error */
export function fetchErrorMessage(
  error: unknown,
  fallback = "Не получилось. Попробуйте ещё раз.",
): string {
  return apiErrorMessage(readApiErrorCode(error), fallback);
}
