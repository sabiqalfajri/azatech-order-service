import type { FastifyError } from "fastify";
import { AppError, type FieldErrors } from "../app-error.js";

function getValidationPath(
  item: NonNullable<FastifyError["validation"]>[number],
): string {
  const path = (item.instancePath ?? "")
    .split("/")
    .slice(1)
    .map((segment) =>
      segment.replace(/~1/g, "/").replace(/~0/g, "~"),
    );

  const missingProperty = item.params?.missingProperty;

  if (typeof missingProperty === "string") {
    path.push(missingProperty);
  }

  return path.join(".") || "body";
}

export function handleFastifyValidationError(
  error: FastifyError
): AppError | null {
  if (error.code !== "FST_ERR_VALIDATION") return null;

  const errors: FieldErrors = {};

  for (const item of error.validation ?? []) {
    const key = getValidationPath(item);

    (errors[key] ??= []).push(
      item.message ?? "Nilai tidak valid",
    );
  }

  return new AppError("Validasi gagal", 422, errors);
}

export function handleFastifyContentTypeParserError(
  error: Error | FastifyError
): AppError | null {
  if (!("code" in error)) return null;

  switch (error.code) {
    case "FST_ERR_CTP_EMPTY_JSON_BODY":
      return new AppError("Request body tidak boleh kosong", 400);
    case "FST_ERR_CTP_INVALID_MEDIA_TYPE":
      return new AppError("Content-Type tidak didukung", 415);
    case "FST_ERR_CTP_BODY_TOO_LARGE":
      return new AppError("Request body terlalu besar", 413);
    default:
      return null;
  }
}