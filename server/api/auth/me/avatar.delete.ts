/**
 * DELETE /api/auth/me/avatar — убрать аватар из профиля и из бакета.
 */
import { avatarObjectKey, deleteS3Object } from "../../../utils/s3";

const meSelect = {
  id: true,
  email: true,
  name: true,
  avatarSrc: true,
  avatarColor: true,
  bio: true,
  country: true,
  birthDate: true,
  gender: true,
} as const;

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const key = avatarObjectKey(session.user.id);

  await deleteS3Object(key).catch(() => {});

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarSrc: null, avatarColor: null },
    select: meSelect,
  });

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarSrc: user.avatarSrc,
    },
  });

  return user;
});
