# API

Nitro, префикс `/api`. Сессия: `nuxt-auth-utils` (cookie). Middleware кладёт `event.context.userId`. Без сессии: `isLiked = false`; `liked` / `sort=likedAt` / лайки / me → **401**.

Публичный user: `id`, `name`, `avatarSrc`, `bio`. Id — cuid.

## Auth

### `POST /api/auth/register`

Body: `{ email, password, name }` (≥8 символов). Создаёт user + сессию.  
Ответ: `{ id, email, name, avatarSrc, bio }` · `400` / `409`

### `POST /api/auth/login`

Body: `{ email, password }`. Сессия.  
Ответ: как register · `400` / `401`  
Сид: `platina@example.com` / `password`

### `POST /api/auth/logout`

Сброс сессии → `{ ok: true }`

### `GET /api/auth/me`

Текущий user (+ email). Auth. `401`

## Albums

### `GET /api/albums`

Список без треков.

Query: `search`, `liked=true`, `sort=newest|oldest|name|likedAt`

Примеры: `/api/albums`, `?search=moon`, `?liked=true&sort=likedAt`

Ответ: альбом + `artist` + `genres[]` + `isLiked` + `coverColor` (`#rrggbb` или `null`)

### `POST /api/albums`

Создать альбом с треками. Auth. `multipart/form-data`:

- `name` — название альбома
- `cover` — картинка ≤10MB (необязательно): JPEG / PNG / WebP / AVIF → в бакете `covers/albums/{id}.webp` (800×800); `coverColor` — accent hex для hero (`#rrggbb`, сэмпл 48×48, hue-bin по насыщенным пикселям, нормализация L≈0.38)
- `tracks[0][name]`, `tracks[0][audio]` — имя и MP3 (≤30MB); индексы `0…n`
- `tracks[i][isExplicit]` — необязательно (`true`/`1`)
- длительность не с клиента: `music-metadata` по файлу; не аудио → 400

Нужен хотя бы один трек с именем и mp3 (не больше 20). Имена ≤120 символов. Сумма файлов ≤200MB.  
Порядок: альбом в БД → обложка WebP → трек в БД (длительность из файла) → `audio/{trackId}.mp3`.  
После `put` ключ сразу в откат. При ошибке загрузки — откат строк и файлов.

Ответ: как `GET /api/albums/:id` (`tracks[]`, `artist`, `genres[]`, `isLiked: false`) · `400` / `401`

### `GET /api/albums/:id`

Альбом целиком: `artist` + `genres[]` + `isLiked` + `likesCount` + `trackCount` + `totalDurationSec`  
`tracks[]` (по `trackNumber`) — как в `GET /api/tracks`: `artist`, `album`, `genres[]`, `isLiked`  
`400` / `404`

### `DELETE /api/albums/:id`

Удалить альбом. Auth, только автор. Сначала объекты в бакете (`coverSrc`, `audioSrc` треков), затем строка в БД (треки и связи — каскадом).  
Ответ: `{ ok: true }` · `400` / `401` / `403` / `404`

### `POST /api/albums/:id/like` · `DELETE /api/albums/:id/like`

Лайк альбома. Ответ: `{ isLiked }`. Auth. `401` / `404`

## Tracks

### `GET /api/tracks`

Query: `search` (трек / артист / альбом), `liked=true`, `sort=newest|oldest|name|likedAt`

Примеры: `/api/tracks`, `?search=night`, `?liked=true&sort=likedAt`

Ответ: трек + `artist` + `album` (`id`, `name`, `coverSrc`) + `genres[]` + `isLiked`

### `GET /api/tracks/:id`

Трек + `artist` + `album` (+ `artist`) + `genres[]` + `isLiked`  
`400` / `404`

### `POST /api/tracks/:id/like` · `DELETE /api/tracks/:id/like`

Добавить / убрать трек в системном плейлисте «Любимые». Ответ: `{ isLiked }`. Auth. `401` / `404`

## Playlists

### `GET /api/playlists`

Плейлисты текущего user (включая «Любимые»). Auth. `401`

### `POST /api/playlists`

Body: `{ name, isPublic? }` — user playlist. Auth. `400` / `401`

### `GET /api/playlists/:id`

Meta + `tracks[]` (как `GET /api/tracks`). Владелец или `isPublic`.  
`400` · `404` · `403` (`private_playlist` — чужой приватный плейлист)

### `PATCH /api/playlists/:id` · `DELETE /api/playlists/:id`

Только user playlists; system «Любимые» нельзя. Auth. `400` / `403` / `404`

### `POST /api/playlists/:id/tracks` · `DELETE /api/playlists/:id/tracks/:trackId`

Body (POST): `{ trackId }`. Auth. `403` / `404`

## Artists

### `GET /api/artists`

Query: `search` (имя), `liked=true`, `sort=newest|oldest|name|likedAt` (по умолчанию `name`)

Примеры: `/api/artists`, `?search=волн`, `?liked=true&sort=likedAt`

Ответ: публичный user + `isLiked`

### `GET /api/artists/:id`

Профиль + `albums[]` (без треков, с `genres[]` и `isLiked`) + `isLiked`  
`400` / `404`

### `POST /api/artists/:id/like` · `DELETE /api/artists/:id/like`

Лайк артиста (не себя). Ответ: `{ isLiked }`. Auth. `400` / `401` / `404`

## Genres

### `GET /api/genres`

Список жанров. Ответ: `{ id, name, slug }[]`, сортировка по `name`.

## Ошибки

Единый формат: **`statusMessage`** — snake_case код из `shared/apiErrorCodes.ts` (`ApiErrorCode`).

```json
{
  "statusCode": 404,
  "statusMessage": "album_not_found",
  "message": "album_not_found"
}
```

Сервер: `throwApiError(statusCode, ApiErrorCode.…)` из `server/utils/apiError.ts`.  
Клиент: `fetchErrorMessage(error)` / `apiErrorMessage(code)` в `app/utils/apiErrorMessage.ts`.  
Страница ошибок: `app/error.vue`.

Опционально в теле: `data` (например `{ kind }` для `invalid_link_kind`).

---

### `401`

| Код | Когда |
|---|---|
| `authentication_required` | Auth без сессии; `?liked=true` на list |
| `invalid_credentials` | `POST /api/auth/login` |
| `user_not_found` | `GET /api/auth/me`, `POST /api/albums` |

### `403`

| Код | Когда |
|---|---|
| `private_playlist` | `GET /api/playlists/:id` — чужой приватный |
| `forbidden` | Не владелец (album delete, playlist CRUD/tracks) |

### `404`

| Код | Когда |
|---|---|
| `album_not_found` | Альбом |
| `artist_not_found` | Артист |
| `track_not_found` | Трек |
| `playlist_not_found` | Плейлист |
| `media_not_found` | `GET /api/media/:key` |

### `409` · `413` · `416` · `429`

| HTTP | Код |
|---|---|
| 409 | `email_already_registered` |
| 413 | `payload_too_large` |
| 416 | `range_not_satisfiable` |
| 429 | `code_rate_limited` |

### `400` — auth

| Код | Эндпоинты |
|---|---|
| `email_password_required` | login |
| `verify_email_required` | register (legacy) |
| `registration_fields_invalid` | register/send-code |
| `name_too_long` | send-code |
| `password_too_short` | send-code, forgot/reset |
| `code_required` | verify, forgot |
| `code_expired_or_invalid` | verify, forgot |
| `code_too_many_attempts` | verify, forgot |
| `code_invalid` | verify, forgot |
| `email_required` | forgot/send-code |

### `400` — профиль (`/api/auth/me`)

| Код |
|---|
| `name_required` · `name_too_long` · `bio_too_long` · `country_too_long` |
| `invalid_birth_date` · `invalid_gender` · `no_fields_to_update` |
| `avatar_file_required` · `avatar_too_large` · `avatar_must_be_image` |
| `links_required` · `too_many_links` · `invalid_link_kind` · `duplicate_link_kind` · `invalid_link_url` |

### `400` — upload / альбомы

| Код |
|---|
| `album_id_required` · `multipart_form_required` · `album_name_required` |
| `album_name_too_long` · `album_tracks_required` · `album_tracks_too_many` |
| `album_cover_too_large` · `cover_must_be_image` |
| `album_track_name_required` · `album_track_name_too_long` |
| `album_track_audio_required` · `album_audio_too_large` · `audio_invalid` |

### `400` — треки · плейлисты · media

| Код | Область |
|---|---|
| `track_id_required` · `played_sec_required` · `listen_threshold_not_met` | треки |
| `playlist_id_required` · `playlist_not_found` · `playlist_name_required` | плейлисты |
| `system_playlist_not_editable` · `system_playlist_not_deletable` | «Любимые» |
| `playlist_track_id_required` · `playlist_ids_required` | tracks в плейлисте |
| `artist_id_required` | артисты |
| `invalid_media_key` | media |

Полный enum — **`shared/apiErrorCodes.ts`**.

## Планируется

`artistId` / `genre` в tracks/albums · upload треков / CRUD · scrobble
