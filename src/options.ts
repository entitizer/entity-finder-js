import { InvalidArgumentError } from "./errors.js";
import { MAX_PAGES_PER_QUERY } from "./wikipedia/api.js";

export const DEFAULT_LIMIT = 2;

/** Extra results pulled so filtering out disambiguation pages still fills `limit`. */
const OVERFETCH = 3;

/** Trims the query and rejects a blank one, which would search for nothing. */
export function normalizeName(name: string): string {
  const normalized = String(name ?? "").trim();
  if (normalized.length === 0) {
    throw new InvalidArgumentError("`name` must be a non-empty string");
  }
  return normalized;
}

export function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGES_PER_QUERY);
}

/**
 * Number of pages to request so that, after dropping disambiguation pages,
 * there is still a good chance of returning `limit` results.
 */
export function fetchLimit(limit: number, includeDisambiguation: boolean): number {
  if (includeDisambiguation) return limit;
  return Math.min(limit * 2 + OVERFETCH, MAX_PAGES_PER_QUERY);
}
