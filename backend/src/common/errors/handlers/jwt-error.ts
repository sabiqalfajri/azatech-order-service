import { AppError } from "../app-error.js";

type JwtErrorLike = {
  code?: string;
};

function isJwtError(error: unknown): error is JwtErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  );
}

export function isJwtExpired(error: unknown): boolean {
  if (!isJwtError(error)) return false;

  return (
    error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED" ||
    error.code === "FAST_JWT_EXPIRED"
  );
}

export function isJwtInvalid(error: unknown): boolean {
  if (!isJwtError(error)) return false;

  return (
    error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID" ||
    error.code === "FAST_JWT_INVALID_SIGNATURE" ||
    error.code === "FAST_JWT_MALFORMED" ||
    error.code === "FAST_JWT_INVALID_ALGORITHM" ||
    error.code === "FAST_JWT_INVALID_CLAIM_TYPE" ||
    error.code === "FAST_JWT_INVALID_CLAIM_VALUE" ||
    error.code === "FAST_JWT_MISSING_REQUIRED_CLAIM" ||
    error.code === "FAST_JWT_INVALID_PAYLOAD" ||
    error.code === "FAST_JWT_INACTIVE" ||
    error.code === "FAST_JWT_MISSING_SIGNATURE"
  );
}

export function handleJwtError(error: unknown): AppError | null {
  if (!isJwtError(error)) return null;

  if (error.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER") {
    return new AppError("Authorization header is required", 401);
  }

  if (error.code === "FST_JWT_BAD_REQUEST") {
    return new AppError(
      "Authorization header must use Bearer token format",
      401,
    );
  }

  if (isJwtExpired(error)) {
    return new AppError("Token has expired", 401);
  }

  if (isJwtInvalid(error)) {
    return new AppError("Invalid token", 401);
  }

  return null;
}