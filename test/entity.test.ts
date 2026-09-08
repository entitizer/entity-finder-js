import { describe, expect, it } from "vitest";

import { byRelevance, toEntityPage } from "../src/entity.js";
import {
  adrianUrsuDisambiguation,
  adrianUrsuSinger,
  moldovaAreTalent,
  republicaMoldova,
} from "./helpers/fixtures.js";

describe("toEntityPage", () => {
  it("maps identifiers, urls and descriptions", () => {
    const entity = toEntityPage(adrianUrsuSinger, "Adrian Ursu", "ro");

    expect(entity).toMatchObject({
      title: "Adrian Ursu (cântăreț)",
      simple: "Adrian Ursu",
      special: "cântăreț",
      lang: "ro",
      pageId: 1226363,
      wikidataId: "Q18548924",
      shortDescription: "cântăreț din Republica Moldova",
      isDisambiguation: false,
    });
    expect(entity.url).toContain("ro.wikipedia.org");
  });

  it("builds `about` by dropping parentheses and cutting at a phrase boundary", () => {
    const entity = toEntityPage(adrianUrsuSinger, "Adrian Ursu", "ro");

    expect(entity.about).toBe(
      "Adrian Ursu este un cântăreț, cantautor și prezentator TV din Republica Moldova",
    );
    expect(entity.extract).toContain("(Zis Lupu)");
  });

  it("flags disambiguation pages from pageprops", () => {
    expect(toEntityPage(adrianUrsuDisambiguation, "Adrian Ursu", "ro").isDisambiguation).toBe(true);
    expect(toEntityPage(adrianUrsuSinger, "Adrian Ursu", "ro").isDisambiguation).toBe(false);
  });

  it("trusts pageprops over the title when the API answered", () => {
    // "(disambiguation)" in the title, but Wikipedia says it is an article.
    const entity = toEntityPage(
      {
        title: "Mercury (disambiguation)",
        pageid: 7,
        pageprops: { wikibase_item: "Q1" },
      },
      "Mercury",
      "en",
    );

    expect(entity.isDisambiguation).toBe(false);
  });

  it("falls back to the localized title suffix when pageprops is absent", () => {
    const entity = toEntityPage({ title: "Moldova (dezambiguizare)", pageid: 1 }, "Moldova", "ro");
    expect(entity.isDisambiguation).toBe(true);

    const english = toEntityPage({ title: "Mercury (disambiguation)", pageid: 2 }, "Mercury", "en");
    expect(english.isDisambiguation).toBe(true);
  });

  it("does not mistake an ordinary qualifier for a disambiguation marker", () => {
    expect(
      toEntityPage({ title: "Adrian Ursu (jurnalist)", pageid: 3 }, "Adrian Ursu", "ro")
        .isDisambiguation,
    ).toBe(false);
  });

  it("survives a page with no extract or description", () => {
    const entity = toEntityPage({ title: "Bare", pageid: 9 }, "Bare", "en");

    expect(entity.extract).toBeUndefined();
    expect(entity.about).toBeUndefined();
    expect(entity.shortDescription).toBeUndefined();
    expect(entity.titleScore).toBe(1);
  });

  it("includes categories when the API returned them", () => {
    const entity = toEntityPage(
      {
        title: "Republica Moldova",
        pageid: 1946,
        categories: [
          { ns: 14, title: "Categorie:State din Europa" },
          { ns: 14, title: "Categorie:Republica Moldova" },
        ],
      },
      "Moldova",
      "ro",
    );

    expect(entity.categories).toEqual([
      "Categorie:State din Europa",
      "Categorie:Republica Moldova",
    ]);
  });

  it("scores an exact-ish title above a merely related page", () => {
    const singer = toEntityPage(adrianUrsuSinger, "Adrian Ursu moldova", "ro");
    const show = toEntityPage(moldovaAreTalent, "Adrian Ursu moldova", "ro");

    expect(singer.score).toBeGreaterThan(show.score);
    expect(singer.titleScore).toBeGreaterThan(show.titleScore);
  });

  it("keeps scores inside [0, 1]", () => {
    for (const page of [adrianUrsuSinger, moldovaAreTalent, republicaMoldova]) {
      const entity = toEntityPage(page, "R. Moldova", "ro");
      expect(entity.score).toBeGreaterThanOrEqual(0);
      expect(entity.score).toBeLessThanOrEqual(1);
      expect(entity.titleScore).toBeGreaterThanOrEqual(0);
      expect(entity.titleScore).toBeLessThanOrEqual(1);
    }
  });

  it("rewards an abbreviated query that matches the article", () => {
    const entity = toEntityPage(republicaMoldova, "R. Moldova", "ro");
    expect(entity.titleScore).toBeGreaterThan(0.5);
    expect(entity.score).toBeGreaterThan(0.5);
  });
});

describe("byRelevance", () => {
  it("sorts higher scores first", () => {
    const pages = [moldovaAreTalent, adrianUrsuSinger].map((page) =>
      toEntityPage(page, "Adrian Ursu", "ro"),
    );

    expect(pages.toSorted(byRelevance)[0]?.title).toBe("Adrian Ursu (cântăreț)");
  });
});
