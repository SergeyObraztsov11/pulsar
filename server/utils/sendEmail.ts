/**
 * Письма через Resend. Без RESEND_API_KEY — только лог (dev).
 */

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

/** Отправляю письмо или пишу текст в лог, если ключа нет */
export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM?.trim() || "Pulsar <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(`[email] to=${input.to} subject=${input.subject}\n${input.text}`);
    return;
  }

  await $fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: {
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    },
  });
}
