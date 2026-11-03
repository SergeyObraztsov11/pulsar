# Seed albums

Медиа пяти альбомов для `npm run db:seed` хранятся локально и исключены из Git. `manifest.json` фиксирует названия, порядок, длительности и размеры.

- Ориентировочный объём в `seed-albums/`: **~307 MiB** (49 треков и обложки).

## Подготовка (копирование из папки с альбомами)

Нужны каталоги с **точными** именами внутри корня источников:

- `Astroworld (2018) - Travis Scott`
- `Best Of 2017 - 50 Cent`
- `Greatest Hits (2012) - Nickelback`
- `Nirvana 1991 - Nevermind`
- `This & That (2026) - Stray Kids`

Корень источников по умолчанию: `%USERPROFILE%\Desktop` (Windows) или `$HOME/Desktop` (macOS/Linux). Можно передать явно:

```bash
node scripts/prepare-seed-albums.mjs
node scripts/prepare-seed-albums.mjs --source "/path/to/albums-root"
node scripts/prepare-seed-albums.mjs "/path/to/albums-root"
```

Только копирование (исходники не перемещаются). Пишет `01.mp3`…`N.mp3`, `cover.jpg`, обновляет `manifest.json`. Дубль Astroworld `Stargazing (1)` не копируется.

## Импорт в БД + MinIO

Нужны Postgres и MinIO из `.env` (`NUXT_S3_*`, `DATABASE_URL`):

```bash
docker compose up -d
npm run db:seed
```

Идемпотентно: upsert артистов/альбомов/треков сида и перезапись объектов в S3. Чужие пользователи и альбомы **не** удаляются.

Пароль сид-артистов: `password` (email `*@example.com`).

## Повторный запуск / ошибки

| Ситуация | Что делать |
|----------|------------|
| Нет `manifest.json` / mp3 | Снова `node scripts/prepare-seed-albums.mjs` (при необходимости `--source`) |
| Нет `NUXT_S3_*` / `DATABASE_URL` | Скопировать `.env.example` → `.env` |
| MinIO недоступен | Поднять MinIO; бакет `media` (`minio-init`) |
| Конфликт email артиста | Другая строка уже занимает `*@example.com` |
| Старый wipe-сид | `prisma/seed.legacy.ts` — **разрушительный**, не запускать на рабочей БД |

## Структура

```
seed-albums/
  manifest.json
  README.md
  astroworld/cover.jpg 01.mp3 …
  best-of-2017/…
  greatest-hits-nickelback/…
  nevermind/…
  this-and-that/…
```
