import { describe, expect, it } from "vitest";

import { InvalidArgumentError, WikipediaApiError } from "../src/errors.js";
import {
  MAX_PAGES_PER_QUERY,
  buildApiUrl,
  normalizeLang,
  prefixSearchPages,
  query,
  searchPages,
} from "../src/wikipedia/api.js";
import {
  adrianUrsuDisambiguation,
  adrianUrsuJournalist,
  adrianUrsuSinger,
} from "./helpers/fixtures.js";
import { mockFetch, queryResponse } from "./helpers/mock-fetch.js";

describe("normalizeLang", () => {
  it("trims, lowercases and accepts variants", () => {
    expect(normalizeLang("  RO ")).toBe("ro");
    expect(normalizeLang("zh-yue")).toBe("zh-yue");
    expect(normalizeLang("be_tarask")).toBe("be-tarask");
  });

  it("rejects anything that could change the request host", () => {
    for (const bad of ["", "  ", "evil.com", "ro.wikipedia.org", "ro/", "a", "../x", "ro#"]) {
      expect(() => normalizeLang(bad)).toThrow(InvalidArgumentError);
    }
  });
});

describe("buildApiUrl", () => {
  it("targets the language's Wikipedia API", () => {
    const url = new URL(buildApiUrl("ro", { action: "query" }));
    expect(url.origin).toBe("https://ro.wikipedia.org");
    expect(url.pathname).toBe("/w/api.php");
  });

  it("serialises booleans as 1/0 and drops undefined", () => {
    const url = new URL(buildApiUrl("en", { yes: true, no: false, skip: undefined, n: 5 }));
    expect(url.searchParams.get("yes")).toBe("1");
    expect(url.searchParams.get("no")).toBe("0");
    expect(url.searchParams.has("skip")).toBe(false);
    expect(url.searchParams.get("n")).toBe("5");
  });

  it("escapes values instead of injecting them into the query string", () => {
    const url = new URL(buildApiUrl("en", { gsrsearch: "a&b=c d" }));
    expect(url.searchParams.get("gsrsearch")).toBe("a&b=c d");
  });
});

describe("query", () => {
  it("always requests formatversion 2", async () => {
    const mock = mockFetch([queryResponse([])]);
    await query("ro", {}, { fetch: mock.fetch });

    expect(mock.params().get("action")).toBe("query");
    expect(mock.params().get("formatversion")).toBe("2");
    expect(mock.params().get("format")).toBe("json");
  });

  it("turns an API-level error into WikipediaApiError", async () => {
    const mock = mockFetch([{ error: { code: "maxlag", info: "Waiting for a database" } }]);

    const error = await query("ro", {}, { fetch: mock.fetch }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(WikipediaApiError);
    expect(error).toMatchObject({ code: "maxlag", lang: "ro" });
  });
});

describe("searchPages", () => {
  it("requests the properties the entity mapping needs", async () => {
    const mock = mockFetch([queryResponse([])]);
    await searchPages("ro", "Adrian Ursu", { limit: 5, fetch: mock.fetch });

    const params = mock.params();
    expect(params.get("generator")).toBe("search");
    expect(params.get("gsrsearch")).toBe("Adrian Ursu");
    expect(params.get("gsrlimit")).toBe("5");
    expect(params.get("prop")).toBe("extracts|pageprops|description|info");
    expect(params.get("ppprop")).toBe("disambiguation|wikibase_item");
    expect(params.get("exlimit")).toBe("max");
    expect(params.get("redirects")).toBe("1");
  });

  it("clamps the limit to what prop=extracts can return", async () => {
    const mock = mockFetch([queryResponse([])]);
    await searchPages("ro", "x", { limit: 500, fetch: mock.fetch });
    expect(mock.params().get("gsrlimit")).toBe(String(MAX_PAGES_PER_QUERY));

    const mock2 = mockFetch([queryResponse([])]);
    await searchPages("ro", "x", { limit: 0, fetch: mock2.fetch });
    expect(mock2.params().get("gsrlimit")).toBe("1");
  });

  it("adds categories only when asked", async () => {
    const without = mockFetch([queryResponse([])]);
    await searchPages("ro", "x", { fetch: without.fetch });
    expect(without.params().get("prop")).not.toContain("categories");

    const withCats = mockFetch([queryResponse([])]);
    await searchPages("ro", "x", { includeCategories: true, fetch: withCats.fetch });
    expect(withCats.params().get("prop")).toContain("categories");
    expect(withCats.params().get("clshow")).toBe("!hidden");
  });

  it("orders pages by the search index, not by the object key order", async () => {
    const mock = mockFetch([
      queryResponse([adrianUrsuJournalist, adrianUrsuDisambiguation, adrianUrsuSinger]),
    ]);

    const pages = await searchPages("ro", "Adrian Ursu", { fetch: mock.fetch });
    expect(pages.map((page) => page.title)).toEqual([
      "Adrian Ursu",
      "Adrian Ursu (cântăreț)",
      "Adrian Ursu (jurnalist)",
    ]);
  });

  it("drops missing pages and tolerates an empty result", async () => {
    const mock = mockFetch([
      queryResponse([{ title: "Nope", missing: true }, adrianUrsuSinger]),
      { batchcomplete: true },
    ]);

    expect(await searchPages("ro", "x", { fetch: mock.fetch })).toHaveLength(1);
    expect(await searchPages("ro", "x", { fetch: mock.fetch })).toEqual([]);
  });
});

describe("prefixSearchPages", () => {
  it("uses the fuzzy prefix generator", async () => {
    const mock = mockFetch([queryResponse([])]);
    await prefixSearchPages("ro", "Brashov", { limit: 3, fetch: mock.fetch });

    const params = mock.params();
    expect(params.get("generator")).toBe("prefixsearch");
    expect(params.get("gpssearch")).toBe("Brashov");
    expect(params.get("gpslimit")).toBe("3");
    expect(params.get("gpsprofile")).toBe("fuzzy");
    expect(params.get("gpsnamespace")).toBe("0");
  });
});
