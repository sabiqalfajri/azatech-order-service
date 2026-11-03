import type { FieldErrors } from "../common/errors/app-error.js";

export type ResponseMeta = {
  page: number;
  per_page: number;
  total: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  meta?: ResponseMeta;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: FieldErrors;
};

export function successResponse<T>(
  data: T,
  message = "Success",
  meta?: ResponseMeta,
): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
}

export function errorResponse(
  message = "Internal server error",
  errors?: FieldErrors,
): ApiErrorResponse {
  return {
    success: false,
    message,
    ...(errors && Object.keys(errors).length > 0 && { errors }),
  };
}