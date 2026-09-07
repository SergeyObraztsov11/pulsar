import { ApiErrorCode, throwApiError } from "../../utils/apiError";

/**
 * PATCH /api/auth/me — частичное обновление профиля.
 * В body только меняемые поля: name | bio | country | gender | day+month+year.
 */
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const body = await readBody<{
    name?: string;
    bio?: string | null;
    country?: string | null;
    day?: string;
    month?: string;
    year?: string;
    gender?: string | null;
  }>(event);

  const data: {
    name?: string;
    bio?: string | null;
    country?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      throwApiError(400, ApiErrorCode.NAME_REQUIRED);
    }
    if (name.length > 50) {
      throwApiError(400, ApiErrorCode.NAME_TOO_LONG);
    }
    data.name = name;
  }

  if (body.bio !== undefined) {
    const bioRaw = body.bio == null ? "" : String(body.bio).trim();
    const bio = bioRaw ? bioRaw : null;
    if (bio && bio.length > 1000) {
      throwApiError(400, ApiErrorCode.BIO_TOO_LONG);
    }
    data.bio = bio;
  }

  if (body.country !== undefined) {
    const countryRaw =
      body.country == null ? "" : String(body.country).trim();
    const country = countryRaw ? countryRaw : null;
    if (country && country.length > 80) {
      throwApiError(400, ApiErrorCode.COUNTRY_TOO_LONG);
    }
    data.country = country;
  }

  const hasBirthKeys =
    body.day !== undefined ||
    body.month !== undefined ||
    body.year !== undefined;
  if (hasBirthKeys) {
    const day = body.day?.trim() ?? "";
    const month = body.month?.trim() ?? "";
    const year = body.year?.trim() ?? "";
    if (!day && !month && !year) {
      data.birthDate = null;
    } else {
      const birthDate = parseBirthDate(day, month, year);
      if (!birthDate) {
        throwApiError(400, ApiErrorCode.INVALID_BIRTH_DATE);
      }
      data.birthDate = birthDate;
    }
  }

  if (body.gender !== undefined) {
    const genderRaw =
      body.gender == null ? "" : String(body.gender).trim();
    const gender = genderRaw ? genderRaw : null;
    if (gender && !isGender(gender)) {
      throwApiError(400, ApiErrorCode.INVALID_GENDER);
    }
    data.gender = gender;
  }

  if (Object.keys(data).length === 0) {
    throwApiError(400, ApiErrorCode.NO_FIELDS_TO_UPDATE);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarSrc: true,
      avatarColor: true,
      bio: true,
      country: true,
      birthDate: true,
      gender: true,
    },
  });

  if (data.name !== undefined) {
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarSrc: user.avatarSrc,
      },
    });
  }

  return user;
});
