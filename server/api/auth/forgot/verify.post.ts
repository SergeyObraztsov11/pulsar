import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/auth/forgot/verify — проверка кода сброса.
 * Body: { email, code }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string }>(event);

  const email = body.email?.trim().toLowerCase() ?? "";
  const code = body.code?.trim() ?? "";

  if (!email || code.length !== REGISTER_OTP_LENGTH) {
    throwApiError(400, ApiErrorCode.CODE_REQUIRED);
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

  return { ok: true };
});
