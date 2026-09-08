import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError, TimeoutError } from "../src/errors.js";
import { DEFAULT_USER_AGENT, requestJson } from "../src/http.js";
import { errorResponse, jsonResponse, mockFetch } from "./helpers/mock-fetch.js";

describe("requestJson", () => {
  it("parses a JSON body", async () => {
    const mock = mockFetch([{ hello: "world" }]);
    await expect(requestJson("https://example.com/x", { fetch: mock.fetch })).resolves.toEqual({
      hello: "world",
    });
  });

  it("sends a descriptive User-Agent, as the Wikimedia policy requires", async () => {
    const headers: (RequestInit["headers"] | undefined)[] = [];
    const fetchStub = vi.fn(async (_url: string, init?: RequestInit) => {
      headers.push(init?.headers);
      return jsonResponse({});
    });

    await requestJson("https://example.com/x", { fetch: fetchStub });

    expect(headers[0]).toMatchObject({ "user-agent": DEFAULT_USER_AGENT });
    expect(DEFAULT_USER_AGENT).toMatch(/^entity-finder\/\d+\.\d+\.\d+ \(https:\/\//);
  });

  it("lets the caller override the User-Agent and add headers", async () => {
    let seen: Record<string, string> = {};
    const fetchStub = async (_url: string, init?: RequestInit) => {
      seen = init?.headers as Record<string, string>;
      return jsonResponse({});
    };

    await requestJson("https://example.com/x", {
      fetch: fetchStub,
      userAgent: "my-app/1.0 (https://my.app)",
      headers: { "x-trace": "abc" },
    });

    expect(seen["user-agent"]).toBe("my-app/1.0 (https://my.app)");
    expect(seen["x-trace"]).toBe("abc");
  });

  it("reports a non-JSON 200 response clearly", async () => {
    const html = new Response("<html>Wikimedia error</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });

    await expect(
      requestJson("https://example.com/x", { fetch: mockFetch([html]).fetch, retries: 0 }),
    ).rejects.toThrow(/Invalid JSON/);
  });

  it("throws HttpError with the status for a non-retryable failure", async () => {
    const mock = mockFetch([errorResponse(404)]);

    await expect(
      requestJson("https://example.com/x", { fetch: mock.fetch, retries: 3 }),
    ).rejects.toBeInstanceOf(HttpError);
    expect(mock.requests).toHaveLength(1);
  });

  it("retries 5xx responses and returns the eventual success", async () => {
    const mock = mockFetch([errorResponse(503), errorResponse(503), { ok: true }]);

    await expect(
      requestJson("https://example.com/x", { fetch: mock.fetch, retries: 2, retryDelay: 0 }),
    ).resolves.toEqual({ ok: true });
    expect(mock.requests).toHaveLength(3);
  });

  it("gives up after the configured number of retries", async () => {
    const mock = mockFetch([errorResponse(500)]);

    await expect(
      requestJson("https://example.com/x", { fetch: mock.fetch, retries: 1, retryDelay: 0 }),
    ).rejects.toMatchObject({ name: "HttpError", status: 500 });
    expect(mock.requests).toHaveLength(2);
  });

  it("retries network-level failures", async () => {
    let attempt = 0;
    const fetchStub = async () => {
      attempt++;
      if (attempt === 1) throw new TypeError("fetch failed");
      return jsonResponse({ ok: true });
    };

    await expect(
      requestJson("https://example.com/x", { fetch: fetchStub, retryDelay: 0 }),
    ).resolves.toEqual({ ok: true });
    expect(attempt).toBe(2);
  });

  it("honours Retry-After over the exponential backoff", async () => {
    const mock = mockFetch([errorResponse(429, { "retry-after": "0" }), { ok: true }]);

    await expect(
      requestJson("https://example.com/x", { fetch: mock.fetch, retries: 1, retryDelay: 10_000 }),
    ).resolves.toEqual({ ok: true });
  });

  it("clamps an absurd Retry-After", async () => {
    const response = errorResponse(429, { "retry-after": "99999" });
    const error = await requestJson("https://example.com/x", {
      fetch: mockFetch([response]).fetch,
      retries: 0,
    }).catch((e: unknown) => e as HttpError);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).retryAfter).toBe(60_000);
  });

  it("ignores an unparseable Retry-After", async () => {
    const error = await requestJson("https://example.com/x", {
      fetch: mockFetch([errorResponse(429, { "retry-after": "soon" })]).fetch,
      retries: 0,
    }).catch((e: unknown) => e as HttpError);

    expect((error as HttpError).retryAfter).toBeUndefined();
  });

  it("understands an HTTP-date Retry-After", async () => {
    const soon = new Date(Date.now() + 2000).toUTCString();
    const error = await requestJson("https://example.com/x", {
      fetch: mockFetch([errorResponse(503, { "retry-after": soon })]).fetch,
      retries: 0,
    }).catch((e: unknown) => e as HttpError);

    expect((error as HttpError).retryAfter).toBeGreaterThan(0);
    expect((error as HttpError).retryAfter).toBeLessThanOrEqual(2000);
  });

  it("treats a Retry-After date in the past as no delay", async () => {
    const past = new Date(Date.now() - 60_000).toUTCString();
    const error = await requestJson("https://example.com/x", {
      fetch: mockFetch([errorResponse(503, { "retry-after": past })]).fetch,
      retries: 0,
    }).catch((e: unknown) => e as HttpError);

    expect((error as HttpError).retryAfter).toBe(0);
  });

  it("aborts while waiting between retries", async () => {
    const controller = new AbortController();
    let attempts = 0;
    const fetchStub = async (_url: string, init?: RequestInit) => {
      attempts++;
      init?.signal?.throwIfAborted();
      // Cancel during the backoff that follows this failure.
      setTimeout(() => controller.abort(new Error("cancelled mid-backoff")), 5);
      return errorResponse(503);
    };

    await expect(
      requestJson("https://example.com/x", {
        fetch: fetchStub,
        signal: controller.signal,
        retries: 3,
        retryDelay: 200,
      }),
    ).rejects.toThrow("cancelled mid-backoff");
    expect(attempts).toBe(1);
  });

  it("throws TimeoutError when the request outlives the timeout", async () => {
    const fetchStub = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(init.signal?.reason ?? new Error("aborted"));
        });
      });

    await expect(
      requestJson("https://example.com/x", { fetch: fetchStub, timeout: 10, retries: 0 }),
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it("stops immediately when the caller aborts, without retrying", async () => {
    const controller = new AbortController();
    let attempts = 0;
    const fetchStub = async (_url: string, init?: RequestInit) => {
      attempts++;
      controller.abort(new Error("cancelled"));
      init?.signal?.throwIfAborted();
      return jsonResponse({});
    };

    await expect(
      requestJson("https://example.com/x", {
        fetch: fetchStub,
        signal: controller.signal,
        retries: 5,
        retryDelay: 0,
      }),
    ).rejects.toThrow("cancelled");
    expect(attempts).toBe(1);
  });
});

describe("DEFAULT_USER_AGENT", () => {
  const original = process.env["ENTITY_FINDER_USER_AGENT"];

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (original === undefined) delete process.env["ENTITY_FINDER_USER_AGENT"];
    else process.env["ENTITY_FINDER_USER_AGENT"] = original;
    vi.resetModules();
  });

  it("can be overridden through the environment", async () => {
    process.env["ENTITY_FINDER_USER_AGENT"] = "env-agent/9 (https://env.example)";
    const http = await import("../src/http.js");
    expect(http.DEFAULT_USER_AGENT).toBe("env-agent/9 (https://env.example)");
  });
});
