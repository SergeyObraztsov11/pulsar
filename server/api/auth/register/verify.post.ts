import { createLikedPlaylistForUser } from "../../../utils/likedPlaylist";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/auth/register/verify — verify code, create user and session.
 * Body: { email, code }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string }>(event);

  const email = body.email?.trim().toLowerCase() ?? "";
  const code = body.code?.trim() ?? "";

  if (!email || code.length !== REGISTER_OTP_LENGTH) {
    throwApiError(400, ApiErrorCode.CODE_REQUIRED);
  }

  const otp = await prisma.registerOtp.findUnique({ where: { email } });
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    if (otp) {
      await prisma.registerOtp.delete({ where: { email } });
    }
    throwApiError(400, ApiErrorCode.CODE_EXPIRED_OR_INVALID);
  }

  if (otp.attempts >= REGISTER_OTP_MAX_ATTEMPTS) {
    await prisma.registerOtp.delete({ where: { email } });
    throwApiError(400, ApiErrorCode.CODE_TOO_MANY_ATTEMPTS);
  }

  const valid = await verifyPassword(otp.codeHash, code);
  if (!valid) {
    await prisma.registerOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    throwApiError(400, ApiErrorCode.CODE_INVALID);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    await prisma.registerOtp.delete({ where: { email } });
    throwApiError(409, ApiErrorCode.EMAIL_ALREADY_REGISTERED);
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: otp.email,
        passwordHash: otp.passwordHash,
        name: otp.name,
        birthDate: otp.birthDate,
        gender: otp.gender,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarSrc: true,
        bio: true,
      },
    });
    await createLikedPlaylistForUser(tx, created.id);
    await tx.registerOtp.delete({ where: { email } });
    return created;
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
