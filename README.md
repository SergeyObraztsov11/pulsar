# Pulsar

Веб-приложение для прослушивания и публикации музыки: каталог, плеер, лайки, загрузка альбомов.

Стек: Nuxt 4, Vue 3, Prisma, PostgreSQL, MinIO (S3).

## Требования

- Node.js 24
- Docker Desktop (PostgreSQL и MinIO)

## Установка

```bash
git clone https://github.com/SergeyObraztsov11/pulsar.git
cd pulsar
npm install
```

Скопируй переменные окружения:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Подними инфраструктуру и схему БД:

```bash
docker compose up -d
npm run db:migrate
```

Медиа пяти альбомов находятся локально в `seed-albums/` и исключены из Git. Чтобы подготовить их из папки с исходниками (по умолчанию `Desktop` пользователя; или `--source <dir>`):

```bash
node scripts/prepare-seed-albums.mjs
# node scripts/prepare-seed-albums.mjs --source "/path/to/albums-root"
npm run db:seed
```

`npm run db:seed` **не** очищает чужие пользователи/альбомы: upsert артистов/альбомов/треков сида и перезапись объектов в бакете `media`. Подробности: [`seed-albums/README.md`](seed-albums/README.md). Старый разрушительный сид сохранён как `prisma/seed.legacy.ts` и не подключён к `db:seed`.

Запуск:

```bash
npm run dev
```

Открой [http://127.0.0.1:3000](http://127.0.0.1:3000).

> Без `RESEND_API_KEY` коды регистрации / сброса пароля пишутся в лог сервера (терминал `npm run dev`).

## Скрипты

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка |
| `npm run verify` | Линтер, проверка типов и автоматические тесты |
| `npm run db:migrate` | Миграции Prisma |
| `npm run db:seed` | Идемпотентный импорт seed-albums → БД + MinIO |
| `node scripts/prepare-seed-albums.mjs` | Копирует 5 альбомов в `seed-albums/` из Desktop или `--source` |
| `npm run db:studio` | Просмотр таблиц БД в браузере |
| `docker compose up -d` | Postgres + MinIO |
| `docker compose down` | Остановить контейнеры |

## Ссылки

| Сервис | URL |
|--------|-----|
| Приложение | http://127.0.0.1:3000 |
| MinIO Console | http://127.0.0.1:9001 (логин `minio` / `minio12345`) |

## Документация

- `docs/overview.md` — обзор продукта
- `docs/stack.md` — технологии
- `docs/architecture.md` — структура проекта
- `docs/domain.md` — модель данных
- `docs/api.md` — HTTP API
