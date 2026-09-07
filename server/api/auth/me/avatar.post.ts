/**
 * POST /api/auth/me/avatar — загрузить / заменить аватар (multipart, поле avatar).
 */
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";
import { processUserAvatar } from "../../../utils/processCover";
import { avatarObjectKey, putS3Object } from "../../../utils/s3";

const AVATAR_MAX_BYTES = 10 * 1024 * 1024;

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
  const parts = await readMultipartFormData(event);
  const part = parts?.find((item) => item.name === "avatar" && item.filename);
  if (!part?.data?.length) {
    throwApiError(400, ApiErrorCode.AVATAR_FILE_REQUIRED);
  }
  if (part.data.length > AVATAR_MAX_BYTES) {
    throwApiError(400, ApiErrorCode.AVATAR_TOO_LARGE);
  }

  const { body, avatarColor } = await processUserAvatar(part.data);
  const key = avatarObjectKey(session.user.id);

  await putS3Object({
    key,
    body,
    contentType: "image/jpeg",
  });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarSrc: key, avatarColor },
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
