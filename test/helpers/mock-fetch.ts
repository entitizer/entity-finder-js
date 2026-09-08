import type { FetchLike } from "../../src/http.js";
import type { WikiApiPage, WikiQueryResponse } from "../../src/wikipedia/types.js";

export interface MockFetch {
  fetch: FetchLike;
  /** Every request made, in order. */
  requests: URL[];
  /** Parameters of the request at `index`. */
  params(index?: number): URLSearchParams;
}

export type MockHandler = (url: URL, attempt: number) => Response | Promise<Response>;

/** Builds a `fetch` stub that records requests and replays scripted responses. */
export function mockFetch(handler: MockHandler | Response[] | unknown[]): MockFetch {
  const requests: URL[] = [];

  const resolve: MockHandler = Array.isArray(handler)
    ? (_url, attempt) => {
        const entry = handler[Math.min(attempt, handler.length - 1)];
        return entry instanceof Response ? entry.clone() : jsonResponse(entry);
      }
    : handler;

  return {
    requests,
    params(index = 0) {
      const url = requests[index];
      if (!url) throw new Error(`No request recorded at index ${index}`);
      return url.searchParams;
    },
    fetch: async (input, init) => {
      const url = new URL(input);
      requests.push(url);
      init?.signal?.throwIfAborted();
      return resolve(url, requests.length - 1);
    },
  };
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export function errorResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response("boom", { status, headers });
}

/** Wraps pages in the `action=query&formatversion=2` envelope. */
export function queryResponse(pages: WikiApiPage[]): WikiQueryResponse {
  return { batchcomplete: true, query: { pages } };
}
