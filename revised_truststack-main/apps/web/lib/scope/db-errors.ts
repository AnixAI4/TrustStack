import "server-only";
import { ApiError, rpcError } from "@/lib/api/guard";

/**
 * Postgres errors surfaced by PostgREST → the envelope. Constraint names are
 * never echoed to the client (they describe the schema, not the problem).
 */
export function scopeDbError(
  error: { code?: string; message: string; hint?: string | null },
  op: "create" | "update" | "delete",
): ApiError | Error {
  const mapped = rpcError(error); // TSxxx from triggers (e.g. the organizations column guard)
  if (mapped) return mapped;
  switch (error.code) {
    case "23505":
      return new ApiError(409, "CONFLICT", "An entry with that name already exists in this organisation.");
    case "23503":
      return op === "delete"
        ? new ApiError(409, "CONFLICT", "It is still in use — remove its links first.")
        : new ApiError(422, "VALIDATION_ERROR", "A referenced item does not exist in this organisation.");
    case "23514":
      return new ApiError(400, "VALIDATION_ERROR", "A value is outside the allowed options.");
    case "42501":
      return new ApiError(403, "FORBIDDEN", "You do not have permission to do that.");
    default:
      return new Error(error.message);
  }
}
