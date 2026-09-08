import { describe, expect, it } from "vitest";

import { find } from "../src/find.js";
import { InvalidArgumentError } from "../src/errors.js";
import {
  adrianUrsuDisambiguation,
  adrianUrsuJournalist,
  adrianUrsuSinger,
  allAdrianUrsuPages,
  moldovaAreTalent,
} from "./helpers/fixtures.js";
import { mockFetch, queryResponse } from "./helpers/mock-fetch.js";

describe("find", () => {
  it("returns scored entities ordered by relevance", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);

    const entities = await find("Adrian Ursu moldova", "ro", { limit: 3, fetch: mock.fetch });

    expect(entities.map((entity) => entity.title)).toEqual([
      "Adrian Ursu (cântăreț)",
      "Adrian Ursu (jurnalist)",
      "Moldova are talent",
    ]);
    expect(entities[0]?.wikidataId).toBe("Q18548924");
  });

  it("uses the context words to pick between same-named people", async () => {
    // The API ranks the journalist first; only the singer's summary says Moldova.
    const mock = mockFetch([
      queryResponse([
        { ...adrianUrsuJournalist, index: 1 },
        { ...adrianUrsuSinger, index: 2 },
      ]),
    ]);

    const entities = await find("Adrian Ursu moldova", "ro", { limit: 2, fetch: mock.fetch });

    expect(entities.map((entity) => entity.special)).toEqual(["cântăreț", "jurnalist"]);
  });

  it("drops disambiguation pages by default", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);

    const entities = await find("Adrian Ursu", "ro", { limit: 5, fetch: mock.fetch });

    expect(entities.some((entity) => entity.isDisambiguation)).toBe(false);
    expect(entities).toHaveLength(3);
  });

  it("keeps disambiguation pages when asked", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);

    const entities = await find("Adrian Ursu", "ro", {
      limit: 5,
      includeDisambiguation: true,
      fetch: mock.fetch,
    });

    expect(entities.some((entity) => entity.isDisambiguation)).toBe(true);
  });

  it("over-fetches so filtering still fills the limit", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);
    await find("Adrian Ursu", "ro", { limit: 2, fetch: mock.fetch });

    // limit 2 -> 2 * 2 + 3
    expect(mock.params().get("gsrlimit")).toBe("7");
  });

  it("does not over-fetch when disambiguation pages are kept", async () => {
    const mock = mockFetch([queryResponse([])]);
    await find("x", "ro", { limit: 2, includeDisambiguation: true, fetch: mock.fetch });

    expect(mock.params().get("gsrlimit")).toBe("2");
  });

  it("never returns more than the limit", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);
    const entities = await find("Adrian Ursu", "ro", { limit: 1, fetch: mock.fetch });

    expect(entities).toHaveLength(1);
  });

  it("returns an empty list when nothing matches", async () => {
    const mock = mockFetch([{ batchcomplete: true }]);
    await expect(find("nothing at all", "ro", { fetch: mock.fetch })).resolves.toEqual([]);
  });

  it("returns an empty list when every hit is a disambiguation page", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuDisambiguation])]);
    await expect(find("Adrian Ursu", "ro", { fetch: mock.fetch })).resolves.toEqual([]);
  });

  it("defaults to a limit of 2", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);
    const entities = await find("Adrian Ursu", "ro", { fetch: mock.fetch });

    expect(entities).toHaveLength(2);
  });

  it("trims the query and normalizes the language", async () => {
    const mock = mockFetch([queryResponse([])]);
    await find("  Adrian Ursu  ", " RO ", { fetch: mock.fetch });

    expect(mock.requests[0]?.hostname).toBe("ro.wikipedia.org");
    expect(mock.params().get("gsrsearch")).toBe("Adrian Ursu");
  });

  it("rejects a blank name and an invalid language", async () => {
    const mock = mockFetch([queryResponse([])]);

    await expect(find("   ", "ro", { fetch: mock.fetch })).rejects.toBeInstanceOf(
      InvalidArgumentError,
    );
    await expect(find("x", "not a language", { fetch: mock.fetch })).rejects.toBeInstanceOf(
      InvalidArgumentError,
    );
    expect(mock.requests).toHaveLength(0);
  });

  it("forwards request options to the transport", async () => {
    let seenAgent: string | undefined;
    const fetchStub = async (url: string, init?: RequestInit) => {
      seenAgent = (init?.headers as Record<string, string> | undefined)?.["user-agent"];
      void url;
      return new Response(JSON.stringify(queryResponse([adrianUrsuJournalist])), {
        headers: { "content-type": "application/json" },
      });
    };

    const entities = await find("Adrian Ursu", "ro", {
      fetch: fetchStub,
      userAgent: "test-agent/1.0 (https://test.example)",
    });

    expect(seenAgent).toBe("test-agent/1.0 (https://test.example)");
    expect(entities[0]?.title).toBe("Adrian Ursu (jurnalist)");
  });

  it("passes includeCategories through and exposes the categories", async () => {
    const mock = mockFetch([
      queryResponse([
        {
          ...adrianUrsuSinger,
          categories: [{ ns: 14, title: "Categorie:Cântăreți moldoveni" }],
        },
      ]),
    ]);

    const [entity] = await find("Adrian Ursu", "ro", {
      includeCategories: true,
      fetch: mock.fetch,
    });

    expect(mock.params().get("prop")).toContain("categories");
    expect(entity?.categories).toEqual(["Categorie:Cântăreți moldoveni"]);
  });

  it("propagates cancellation", async () => {
    const controller = new AbortController();
    controller.abort(new Error("cancelled"));
    const mock = mockFetch([queryResponse([moldovaAreTalent])]);

    await expect(find("x", "ro", { fetch: mock.fetch, signal: controller.signal })).rejects.toThrow(
      "cancelled",
    );
  });

  it("carries the singer's summary through to the result", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuSinger])]);
    const [entity] = await find("Adrian Ursu", "ro", { fetch: mock.fetch });

    expect(entity?.about).toBe(
      "Adrian Ursu este un cântăreț, cantautor și prezentator TV din Republica Moldova",
    );
  });
});
