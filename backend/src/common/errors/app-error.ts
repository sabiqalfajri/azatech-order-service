export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: FieldErrors;

  constructor(message: string, statusCode = 500, errors?: FieldErrors) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace?.(this, this.constructor);
  }
}