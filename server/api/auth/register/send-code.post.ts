import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

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
    throwApiError(400, ApiErrorCode.REGISTRATION_FIELDS_INVALID);
  }

  if (name.length > 50) {
    throwApiError(400, ApiErrorCode.NAME_TOO_LONG);
  }

  if (password.length < 8) {
    throwApiError(400, ApiErrorCode.PASSWORD_TOO_SHORT);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    throwApiError(409, ApiErrorCode.EMAIL_ALREADY_REGISTERED);
  }

  const existingOtp = await prisma.registerOtp.findUnique({
    where: { email },
  });
  if (
    existingOtp &&
    Date.now() - existingOtp.lastSentAt.getTime() < REGISTER_OTP_RESEND_MS
  ) {
    throwApiError(429, ApiErrorCode.CODE_RATE_LIMITED);
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
