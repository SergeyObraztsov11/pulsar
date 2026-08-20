/**
 * POST /api/auth/forgot/send-code — код сброса на email.
 * Всегда { ok: true }, чтобы не палить, есть ли аккаунт.
 * Body: { email }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event);
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Укажите email.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return { ok: true };
  }

  const existingOtp = await prisma.passwordResetOtp.findUnique({
    where: { email },
  });
  if (
    existingOtp &&
    Date.now() - existingOtp.lastSentAt.getTime() < REGISTER_OTP_RESEND_MS
  ) {
    return { ok: true };
  }

  const code = generateRegisterOtp();
  const codeHash = await hashPassword(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REGISTER_OTP_TTL_MS);

  await prisma.passwordResetOtp.upsert({
    where: { email },
    create: {
      email,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
    update: {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
  });

  await sendEmail({
    to: email,
    subject: "Сброс пароля Pulsar",
    text: `Ваш код: ${code}. Он действует 10 минут.`,
  });

  return { ok: true };
});
