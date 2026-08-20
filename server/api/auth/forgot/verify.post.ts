/**
 * POST /api/auth/forgot/verify — проверка кода сброса.
 * Body: { email, code }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string }>(event);

  const email = body.email?.trim().toLowerCase() ?? "";
  const code = body.code?.trim() ?? "";

  if (!email || code.length !== REGISTER_OTP_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: "Введите код из письма.",
    });
  }

  const otp = await prisma.passwordResetOtp.findUnique({ where: { email } });
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    if (otp) {
      await prisma.passwordResetOtp.delete({ where: { email } });
    }
    throw createError({
      statusCode: 400,
      statusMessage: "Код неверный или срок истёк. Запросите новый.",
    });
  }

  if (otp.attempts >= REGISTER_OTP_MAX_ATTEMPTS) {
    await prisma.passwordResetOtp.delete({ where: { email } });
    throw createError({
      statusCode: 400,
      statusMessage: "Слишком много попыток. Запросите код снова.",
    });
  }

  const valid = await verifyPassword(otp.codeHash, code);
  if (!valid) {
    await prisma.passwordResetOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    throw createError({
      statusCode: 400,
      statusMessage: "Неверный код.",
    });
  }

  return { ok: true };
});
