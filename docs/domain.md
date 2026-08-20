# Доменная модель

Источник схемы: `prisma/schema.prisma`.  

## Сущности

- **User** — аккаунт и профиль артиста
- **Album** — альбом пользователя
- **Track** — трек в альбоме
- **Playlist** — плейлист пользователя
- **PlaylistTrack** — трек в плейлисте (позиция)
- **Genre** — справочник жанров
- **TrackGenre** / **AlbumGenre** — связь жанра с треком или альбомом
- **TrackLike** — лайк трека
- **AlbumLike** — лайк альбома
- **ArtistLike** — лайк профиля артиста (User)

## Связи

- User → Album → Track (`artistId` у альбома и трека)
- User → Playlist → Track (через PlaylistTrack, владелец плейлиста — `userId`)
- Track принадлежит Album; `artistId` на треке дублируется для маршрутизации
- Genre связан с Track и Album (многие ко многим)
- лайки связывают User с Track, Album или User (артист)
