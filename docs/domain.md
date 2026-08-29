# Доменная модель

Источник схемы: `prisma/schema.prisma`.  

## Сущности

- **User** — аккаунт и профиль артиста
- **Album** — альбом пользователя
- **Track** — трек в альбоме
- **Playlist** — плейлист пользователя или системный «Любимые» (`systemKind: liked_tracks`)
- **PlaylistTrack** — трек в плейлисте (`position`, `addedAt`)
- **Genre** — справочник жанров
- **TrackGenre** / **AlbumGenre** — связь жанра с треком или альбомом
- **AlbumLike** — лайк альбома
- **ArtistLike** — лайк профиля артиста (User)

♥ трека — строка в системном плейлисте «Любимые», отдельной таблицы лайков треков нет.

## Связи

- User → Album → Track (`artistId` у альбома и трека)
- User → Playlist → Track (через PlaylistTrack; ♥ трека = system playlist)
- Track принадлежит Album; `artistId` на треке дублируется для маршрутизации
- Genre связан с Track и Album (многие ко многим)
- AlbumLike / ArtistLike связывают User с Album или User (артист)
