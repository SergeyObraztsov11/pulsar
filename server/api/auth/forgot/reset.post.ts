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
    throw createError({
      statusCode: 400,
      statusMessage: "Введите код из письма.",
    });
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Пароль должен быть не короче 8 символов.",
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
    throw createError({
      statusCode: 400,
      statusMessage: "Код неверный или срок истёк. Запросите новый.",
    });
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
