import { AppError } from "../app-error.js";

type PostgresErrorLike = {
  code?: string;
  detail?: string;
  constraint?: string;
  column?: string;
};

const PG = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
  INVALID_TEXT_REPRESENTATION: "22P02",
} as const;

const KNOWN_CODES = new Set<string>(Object.values(PG));

function isKnownPgError(error: unknown): error is PostgresErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    KNOWN_CODES.has(error.code)
  );
}

function getPostgresError(error: unknown): PostgresErrorLike | null {
  if (isKnownPgError(error)) return error;
  if (typeof error === "object" && error !== null && "cause" in error) {
    const cause = (error as { cause?: unknown }).cause;
    if (isKnownPgError(cause)) return cause;
  }
  return null;
}

export function handleDrizzleError(error: unknown): AppError | null {
  const pg = getPostgresError(error);
  if (!pg?.code) return null;

  switch (pg.code) {
    case PG.UNIQUE_VIOLATION: {
      if (pg.constraint === "order_items_order_product_uq") {
        return new AppError(
          "Produk duplikat dalam satu order",
          409,
        );
      }

      return new AppError("Data sudah ada", 409);
    }

    case PG.FOREIGN_KEY_VIOLATION:
      return new AppError(
        "Data referensi tidak ditemukan",
        422,
      );

    case PG.NOT_NULL_VIOLATION:
      return new AppError("Validasi gagal", 422);

    case PG.CHECK_VIOLATION:
      return new AppError(
        "Data melanggar aturan constraint",
        422,
      );

    case PG.INVALID_TEXT_REPRESENTATION:
      return new AppError("Format input tidak valid", 422);

    default:
      return null;
  }
}