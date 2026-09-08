/**
 * Base class for every error thrown by this package.
 *
 * Consumers can use `instanceof EntityFinderError` to tell library failures
 * apart from programming errors.
 */
export class EntityFinderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** An HTTP request to the Wikipedia API failed with a non-2xx status. */
export class HttpError extends EntityFinderError {
  readonly status: number;
  readonly url: string;
  /** Value of the `Retry-After` response header, in milliseconds, when present. */
  readonly retryAfter: number | undefined;

  constructor(
    message: string,
    details: { status: number; url: string; retryAfter?: number | undefined },
  ) {
    super(message);
    this.status = details.status;
    this.url = details.url;
    this.retryAfter = details.retryAfter;
  }
}

/**
 * The Wikipedia API answered with HTTP 200 but an `error` payload,
 * e.g. `{ error: { code: "maxlag", info: "..." } }`.
 */
export class WikipediaApiError extends EntityFinderError {
  readonly code: string;
  readonly info: string;
  readonly lang: string;

  constructor(details: { code: string; info: string; lang: string }) {
    super(`Wikipedia API error (${details.lang}) [${details.code}]: ${details.info}`);
    this.code = details.code;
    this.info = details.info;
    this.lang = details.lang;
  }
}

/** The request did not complete within the configured timeout. */
export class TimeoutError extends EntityFinderError {
  readonly timeout: number;
  readonly url: string;

  constructor(details: { timeout: number; url: string }) {
    super(`Request to ${details.url} timed out after ${details.timeout}ms`);
    this.timeout = details.timeout;
    this.url = details.url;
  }
}

/** A required argument was missing or malformed. */
export class InvalidArgumentError extends EntityFinderError {}
