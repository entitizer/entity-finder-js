import createDebug from "debug";

import { EntityFinderError, HttpError, TimeoutError } from "./errors.js";
import { VERSION } from "./version.js";

const debug = createDebug("entity-finder:http");

/** Minimal structural type of `globalThis.fetch`, so tests can inject a stub. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface RequestOptions {
  /** Per-request timeout in milliseconds. Default: `15000`. */
  timeout?: number | undefined;
  /** Extra retries after the first attempt, for timeouts/5xx/429. Default: `2`. */
  retries?: number | undefined;
  /** Base backoff delay in milliseconds, doubled per attempt. Default: `300`. */
  retryDelay?: number | undefined;
  /** Additional request headers. */
  headers?: Readonly<Record<string, string>> | undefined;
  /** Caller-controlled cancellation. Aborting is never retried. */
  signal?: AbortSignal | undefined;
  /**
   * `User-Agent` sent to Wikimedia. Their API policy asks for a descriptive
   * value identifying the application and a contact URL.
   *
   * @see https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy
   */
  userAgent?: string | undefined;
  /** `fetch` implementation to use. Default: `globalThis.fetch`. */
  fetch?: FetchLike | undefined;
}

export const DEFAULT_TIMEOUT = 15_000;
export const DEFAULT_RETRIES = 2;
export const DEFAULT_RETRY_DELAY = 300;

export const DEFAULT_USER_AGENT =
  process.env["ENTITY_FINDER_USER_AGENT"] ??
  `entity-finder/${VERSION} (https://github.com/entitizer/entity-finder-js)`;

/** Statuses worth retrying: transient overload, rate limiting or gateway hiccups. */
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const MAX_RETRY_AFTER = 60_000;

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;

  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.min(Math.max(seconds, 0) * 1000, MAX_RETRY_AFTER);

  const date = Date.parse(header);
  if (Number.isNaN(date)) return undefined;

  return Math.min(Math.max(date - Date.now(), 0), MAX_RETRY_AFTER);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error("Aborted"));
    }

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function isRetryable(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  if (error instanceof HttpError) return RETRYABLE_STATUSES.has(error.status);
  // Network-level failures (DNS, connection reset, ...) surface as plain TypeErrors.
  return error instanceof TypeError;
}

/**
 * Performs a `GET` returning parsed JSON, with a timeout, bounded retries and
 * exponential backoff. Honours `Retry-After` when the server sends one.
 */
export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const retries = Math.max(0, options.retries ?? DEFAULT_RETRIES);
  const retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
  const doFetch = options.fetch ?? globalThis.fetch;

  const headers: Record<string, string> = {
    accept: "application/json",
    "accept-encoding": "gzip, deflate, br",
    "user-agent": options.userAgent ?? DEFAULT_USER_AGENT,
    ...options.headers,
  };

  for (let attempt = 0; ; attempt++) {
    try {
      return await performRequest(url, headers, timeout, doFetch, options.signal);
    } catch (error) {
      options.signal?.throwIfAborted();

      if (attempt >= retries || !isRetryable(error)) throw error;

      const retryAfter = error instanceof HttpError ? error.retryAfter : undefined;
      const delay = retryAfter ?? retryDelay * 2 ** attempt;
      debug("retrying %s in %dms (attempt %d/%d): %s", url, delay, attempt + 1, retries, error);
      await sleep(delay, options.signal);
    }
  }
}

async function performRequest<T>(
  url: string,
  headers: Record<string, string>,
  timeout: number,
  doFetch: FetchLike,
  signal: AbortSignal | undefined,
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeout);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  debug("GET %s", url);

  let response: Response;
  try {
    response = await doFetch(url, { method: "GET", headers, signal: combined, redirect: "follow" });
  } catch (error) {
    if (timeoutSignal.aborted && !signal?.aborted) throw new TimeoutError({ timeout, url });
    throw error;
  }

  if (!response.ok) {
    throw new HttpError(`Request to ${url} failed with status ${response.status}`, {
      status: response.status,
      url,
      retryAfter: parseRetryAfter(response.headers.get("retry-after")),
    });
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    // MediaWiki occasionally answers 200 with an HTML error page.
    throw new EntityFinderError(`Invalid JSON in the response from ${url}`, { cause: error });
  }
}
