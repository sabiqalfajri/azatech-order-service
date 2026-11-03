import { ZodError } from "zod";
import { AppError, type FieldErrors } from "../app-error.js";

export const handleZodError = (error: unknown): AppError | null => {
  if (!(error instanceof ZodError)) return null;

  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "body";
    (errors[key] ??= []).push(issue.message);
  }

  return new AppError("Validasi gagal", 422, errors);
};