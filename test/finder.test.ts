import { describe, expect, it } from "vitest";

import { createFinder } from "../src/finder.js";
import { InvalidArgumentError } from "../src/errors.js";
import { adrianUrsuSinger } from "./helpers/fixtures.js";
import { mockFetch, queryResponse } from "./helpers/mock-fetch.js";

describe("createFinder", () => {
  it("applies the default language and options", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuSinger])]);
    const finder = createFinder({ lang: "ro", limit: 1, fetch: mock.fetch });

    const entities = await finder.find("Adrian Ursu");

    expect(entities).toHaveLength(1);
    expect(mock.requests[0]?.hostname).toBe("ro.wikipedia.org");
  });

  it("lets a call override the defaults", async () => {
    const mock = mockFetch([queryResponse([])]);
    const finder = createFinder({ lang: "ro", limit: 1, fetch: mock.fetch });

    await finder.find("x", "en", { limit: 5, includeDisambiguation: true });

    expect(mock.requests[0]?.hostname).toBe("en.wikipedia.org");
    expect(mock.params().get("gsrlimit")).toBe("5");
  });

  it("shares defaults with findTitles", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuSinger])]);
    const finder = createFinder({ lang: "ro", fetch: mock.fetch, tags: "moldova" });

    await finder.findTitles("Adrian Ursu");

    expect(mock.params().get("generator")).toBe("prefixsearch");
  });

  it("requires a language somewhere", async () => {
    const finder = createFinder();
    await expect(finder.find("x")).rejects.toBeInstanceOf(InvalidArgumentError);
  });
});
