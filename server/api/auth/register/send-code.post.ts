/**
 * POST /api/auth/register/send-code — черновик + код на email.
 * Body: { email, password, name, day, month, year, gender }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string;
    password?: string;
    name?: string;
    day?: string;
    month?: string;
    year?: string;
    gender?: string;
  }>(event);

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const name = body.name?.trim() ?? "";
  const gender = body.gender?.trim() ?? "";
  const birthDate = parseBirthDate(
    body.day ?? "",
    body.month ?? "",
    body.year ?? "",
  );

  if (!email || !password || !name || !birthDate || !isGender(gender)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Проверьте имя, дату рождения, пол, email и пароль.",
    });
  }

  if (name.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: "Имя слишком длинное.",
    });
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Пароль должен быть не короче 8 символов.",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: "Этот email уже зарегистрирован.",
    });
  }

  const existingOtp = await prisma.registerOtp.findUnique({
    where: { email },
  });
  if (
    existingOtp &&
    Date.now() - existingOtp.lastSentAt.getTime() < REGISTER_OTP_RESEND_MS
  ) {
    throw createError({
      statusCode: 429,
      statusMessage: "Код уже отправлен. Подождите минуту.",
    });
  }

  const code = generateRegisterOtp();
  const codeHash = await hashPassword(code);
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REGISTER_OTP_TTL_MS);

  await prisma.registerOtp.upsert({
    where: { email },
    create: {
      email,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      name,
      passwordHash,
      birthDate,
      gender,
    },
    update: {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      name,
      passwordHash,
      birthDate,
      gender,
    },
  });

  await sendEmail({
    to: email,
    subject: "Код подтверждения Pulsar",
    text: `Ваш код: ${code}. Он действует 10 минут.`,
  });

  return { ok: true };
});
