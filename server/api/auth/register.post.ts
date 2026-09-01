import { ApiErrorCode, throwApiError } from "../../utils/apiError";

/**
 * POST /api/auth/register — больше не создаёт аккаунт без кода.
 * Используйте /api/auth/register/send-code и /verify.
 */
export default defineEventHandler(() => {
  throwApiError(400, ApiErrorCode.VERIFY_EMAIL_REQUIRED);
});
