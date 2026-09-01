import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/auth/forgot/reset — новый пароль по коду, затем сессия.
 * Body: { email, code, password }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string;
    code?: string;
    password?: string;
  }>(event);

  const email = body.email?.trim().toLowerCase() ?? "";
  const code = body.code?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || code.length !== REGISTER_OTP_LENGTH) {
    throwApiError(400, ApiErrorCode.CODE_REQUIRED);
  }

  if (password.length < 8) {
    throwApiError(400, ApiErrorCode.PASSWORD_TOO_SHORT);
  }

  const otp = await prisma.passwordResetOtp.findUnique({ where: { email } });
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    if (otp) {
      await prisma.passwordResetOtp.delete({ where: { email } });
    }
    throwApiError(400, ApiErrorCode.CODE_EXPIRED_OR_INVALID);
  }

  if (otp.attempts >= REGISTER_OTP_MAX_ATTEMPTS) {
    await prisma.passwordResetOtp.delete({ where: { email } });
    throwApiError(400, ApiErrorCode.CODE_TOO_MANY_ATTEMPTS);
  }

  const valid = await verifyPassword(otp.codeHash, code);
  if (!valid) {
    await prisma.passwordResetOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    throwApiError(400, ApiErrorCode.CODE_INVALID);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarSrc: true,
    },
  });
  if (!user) {
    await prisma.passwordResetOtp.delete({ where: { email } });
    throwApiError(400, ApiErrorCode.CODE_EXPIRED_OR_INVALID);
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetOtp.delete({ where: { email } }),
  ]);

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
