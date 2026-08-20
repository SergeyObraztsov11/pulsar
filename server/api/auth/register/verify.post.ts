/**
 * POST /api/auth/register/verify — проверка кода, пользователь и сессия.
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

  const otp = await prisma.registerOtp.findUnique({ where: { email } });
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    if (otp) {
      await prisma.registerOtp.delete({ where: { email } });
    }
    throw createError({
      statusCode: 400,
      statusMessage: "Код неверный или срок истёк. Запросите новый.",
    });
  }

  if (otp.attempts >= REGISTER_OTP_MAX_ATTEMPTS) {
    await prisma.registerOtp.delete({ where: { email } });
    throw createError({
      statusCode: 400,
      statusMessage: "Слишком много попыток. Запросите код снова.",
    });
  }

  const valid = await verifyPassword(otp.codeHash, code);
  if (!valid) {
    await prisma.registerOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    throw createError({
      statusCode: 400,
      statusMessage: "Неверный код.",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    await prisma.registerOtp.delete({ where: { email } });
    throw createError({
      statusCode: 409,
      statusMessage: "Этот email уже зарегистрирован.",
    });
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
