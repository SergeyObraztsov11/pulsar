import { ApiErrorCode, type ApiErrorCode as ApiErrorCodeType } from "../../shared/apiErrorCodes";

export { ApiErrorCode };

/** Throw H3 error with unified statusMessage code */
export function throwApiError(
  statusCode: number,
  code: ApiErrorCodeType,
  data?: Record<string, unknown>,
): never {
  throw createError({
    statusCode,
    statusMessage: code,
    ...(data ? { data } : {}),
  });
}
