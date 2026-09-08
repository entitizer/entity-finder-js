/**
 * Integration tests against the real Wikipedia API.
 *
 * They are skipped unless `LIVE=1` (`npm run test:live`), because they need
 * network access and their expectations depend on live article content.
 */
import { describe, expect, it } from "vitest";

import { createFinder, find, findTitles } from "../../src/index.js";

const live = describe.skipIf(!process.env["LIVE"]);

live("find (live)", () => {
  it("resolves an abbreviated name: R. Moldova -> Republica Moldova", async () => {
    const [entity] = await find("R. Moldova", "ro", { limit: 1 });

    expect(entity?.title).toBe("Republica Moldova");
    expect(entity?.wikidataId).toBe("Q217");
    expect(entity?.about).toMatch(/^Republica Moldova este un stat/);
    expect(entity?.titleScore).toBeGreaterThan(0.5);
    expect(entity?.url).toBe("https://ro.wikipedia.org/wiki/Republica_Moldova");
  });

  it("uses context words to pick the right person", async () => {
    const [entity] = await find("Adrian Ursu moldova", "ro", { limit: 1 });

    expect(entity?.simple).toBe("Adrian Ursu");
    expect(entity?.special).toBe("cântăreț");
    expect(entity?.isDisambiguation).toBe(false);
  });

  it("never returns a disambiguation page, even when the query asks for one", async () => {
    const entities = await find("Moldova (dezambiguizare)", "ro", { limit: 5 });

    expect(entities.every((entity) => !entity.isDisambiguation)).toBe(true);
  });

  it("resolves an abbreviation: PLDM", async () => {
    const [entity] = await find("PLDM", "ro", { limit: 1 });

    expect(entity?.title).toBe("Partidul Liberal Democrat din Moldova");
  });

  it("works for a descriptive English query", async () => {
    const [entity] = await find("democratic party thailand", "en", { limit: 1 });

    expect(entity?.title).toContain("Democrat Party");
    expect(entity?.wikidataId).toMatch(/^Q\d+$/);
  });

  it("resolves entities in a non-Latin script", async () => {
    const [entity] = await find("Москва", "ru", { limit: 1 });

    expect(entity?.title).toBe("Москва");
    expect(entity?.shortDescription).toBeTruthy();
  });
});

live("findTitles (live)", () => {
  it("corrects a misspelled title: Brashov -> Brașov", async () => {
    const entities = await findTitles("Brashov", "ro", { limit: 5 });

    expect(entities[0]?.title).toBe("Brașov");
  });

  it("returns both Adrian Ursu people and no disambiguation page", async () => {
    const entities = await findTitles("Adrian Ursu", "ro", { limit: 10 });

    expect(entities.length).toBeGreaterThanOrEqual(2);
    expect(entities.every((entity) => !entity.isDisambiguation)).toBe(true);
    expect(
      entities
        .slice(0, 2)
        .map((entity) => entity.special)
        .toSorted(),
    ).toEqual(["cântăreț", "jurnalist"]);
  });

  it("orders by tags", async () => {
    const entities = await findTitles("Adrian Ursu", "ro", { limit: 2, tags: "moldova" });

    expect(entities[0]?.special).toBe("cântăreț");
  });

  it("fetches categories on request", async () => {
    const [entity] = await findTitles("Brașov", "ro", { limit: 1, includeCategories: true });

    expect(entity?.categories?.length).toBeGreaterThan(0);
  });

  it("returns many results for a short Russian query", async () => {
    const entities = await findTitles("ЦК", "ru", { limit: 10 });

    expect(entities.length).toBeGreaterThan(5);
  });
});

live("createFinder (live)", () => {
  it("reuses its defaults", async () => {
    const finder = createFinder({
      lang: "en",
      limit: 1,
      userAgent: "entity-finder-tests/2.0 (https://github.com/entitizer/entity-finder-js)",
    });

    const [entity] = await finder.find("Eiffel Tower");
    expect(entity?.wikidataId).toBe("Q243");
  });
});
