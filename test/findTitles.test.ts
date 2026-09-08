import { describe, expect, it } from "vitest";

import { findTitles, orderByTags } from "../src/findTitles.js";
import { toEntityPage } from "../src/entity.js";
import {
  adrianUrsuDisambiguation,
  adrianUrsuJournalist,
  adrianUrsuSinger,
  allAdrianUrsuPages,
  moldovaAreTalent,
} from "./helpers/fixtures.js";
import { mockFetch, queryResponse } from "./helpers/mock-fetch.js";

describe("findTitles", () => {
  it("keeps Wikipedia's prefix ordering", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);

    const entities = await findTitles("Adrian Ursu", "ro", { limit: 3, fetch: mock.fetch });

    expect(entities.map((entity) => entity.title)).toEqual([
      "Adrian Ursu (cântăreț)",
      "Adrian Ursu (jurnalist)",
      "Moldova are talent",
    ]);
  });

  it("filters disambiguation pages", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuDisambiguation, adrianUrsuSinger])]);

    const entities = await findTitles("Adrian Ursu", "ro", { limit: 10, fetch: mock.fetch });

    expect(entities.map((entity) => entity.title)).toEqual(["Adrian Ursu (cântăreț)"]);
  });

  it("pulls tag matches to the front", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuJournalist, adrianUrsuSinger])]);

    const entities = await findTitles("Adrian Ursu", "ro", {
      limit: 2,
      tags: "moldova",
      fetch: mock.fetch,
    });

    expect(entities.map((entity) => entity.simple)).toEqual(["Adrian Ursu", "Adrian Ursu"]);
    expect(entities[0]?.special).toBe("cântăreț");
    expect(entities[1]?.special).toBe("jurnalist");
  });

  it("uses the prefix generator, not full-text search", async () => {
    const mock = mockFetch([queryResponse([])]);
    await findTitles("Brashov", "ro", { fetch: mock.fetch });

    expect(mock.params().get("generator")).toBe("prefixsearch");
  });

  it("returns an empty list when nothing matches", async () => {
    const mock = mockFetch([{ batchcomplete: true }]);
    await expect(findTitles("zzzz", "ro", { fetch: mock.fetch })).resolves.toEqual([]);
  });
});

describe("orderByTags", () => {
  const entities = () =>
    [adrianUrsuJournalist, adrianUrsuSinger, moldovaAreTalent].map((page) =>
      toEntityPage(page, "Adrian Ursu", "ro"),
    );

  it("returns the list unchanged when there are no tags", () => {
    const list = entities();
    expect(orderByTags(list, undefined, 5)).toBe(list);
    expect(orderByTags(list, [], 5)).toBe(list);
    expect(orderByTags(list, "   ", 5)).toBe(list);
  });

  it("returns the list unchanged when no entity matches", () => {
    const list = entities();
    expect(orderByTags(list, "kangaroo", 5)).toBe(list);
  });

  it("ranks a title match above a summary match", () => {
    const list = entities();
    const ordered = orderByTags(list, "moldova", 5);

    expect(ordered[0]?.title).toBe("Moldova are talent");
    expect(ordered[1]?.title).toBe("Adrian Ursu (cântăreț)");
  });

  it("boosts at most `maxBoosted` entities", () => {
    const ordered = orderByTags(entities(), "moldova", 1);

    expect(ordered[0]?.title).toBe("Moldova are talent");
    // The rest keeps its original order.
    expect(ordered.slice(1).map((entity) => entity.title)).toEqual([
      "Adrian Ursu (jurnalist)",
      "Adrian Ursu (cântăreț)",
    ]);
  });

  it("never drops or duplicates entities", () => {
    const list = entities();
    const ordered = orderByTags(list, ["moldova", "jurnalist"], 2);

    expect(ordered).toHaveLength(list.length);
    expect(new Set(ordered).size).toBe(list.length);
  });

  it("ignores a non-positive boost limit", () => {
    const list = entities();
    expect(orderByTags(list, "moldova", 0)).toBe(list);
  });
});
