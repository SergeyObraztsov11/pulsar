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
- `cover` — картинка ≤10MB (необязательно): JPEG / PNG / WebP / AVIF → в бакете `covers/albums/{id}.webp` (800×800); `coverColor` — dominant hex (sharp.stats, L не ниже 0.35)
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

Лайк трека. Ответ: `{ isLiked }`. Auth. `401` / `404`

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

## Планируется

playlists · `artistId` / `genre` в tracks/albums · upload треков / CRUD
