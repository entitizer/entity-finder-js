import { describe, expect, it } from "vitest";

import {
  countWords,
  firstPhrase,
  levenshtein,
  normalizeText,
  removeNestedParentheses,
  similarity,
  splitTitle,
  stripDiacritics,
  wordCoverage,
  words,
  wordsMatch,
} from "../src/text.js";

describe("stripDiacritics", () => {
  it("folds Latin diacritics", () => {
    expect(stripDiacritics("Brașov")).toBe("brasov");
    expect(stripDiacritics("cântăreț")).toBe("cantaret");
    expect(stripDiacritics("Đà Nẵng")).toBe("da nang");
  });

  it("folds Latin letters that have no combining mark", () => {
    expect(stripDiacritics("Łódź")).toBe("lodz");
    expect(stripDiacritics("Ærø")).toBe("aero");
    expect(stripDiacritics("Straße")).toBe("strasse");
  });

  it("keeps marks on non-Latin scripts, where they carry meaning", () => {
    // й must not collapse to и.
    expect(stripDiacritics("Йошкар-Ола")).toBe("йошкар-ола");
    expect(stripDiacritics("Ελλάδα")).toBe("ελλάδα");
  });

  it("leaves Hangul syllables composed", () => {
    expect(stripDiacritics("한국")).toBe("한국");
    expect([...stripDiacritics("한국")]).toHaveLength(2);
  });
});

describe("normalizeText", () => {
  it("drops punctuation and case", () => {
    expect(normalizeText("R. Moldova")).toBe("r moldova");
    expect(normalizeText("  Adrian-Ursu, jr.  ")).toBe("adrian ursu jr");
  });

  it("returns an empty string for punctuation-only input", () => {
    expect(normalizeText("  --- ")).toBe("");
  });
});

describe("words / countWords", () => {
  it("splits on any non-alphanumeric run", () => {
    expect(words("Adrian-Ursu (cântăreț)")).toEqual(["adrian", "ursu", "cantaret"]);
    expect(countWords("Republica Moldova")).toBe(2);
  });

  it("returns an empty list for blank input", () => {
    expect(words("   ")).toEqual([]);
    expect(countWords("")).toBe(0);
  });
});

describe("splitTitle", () => {
  it("splits the trailing qualifier", () => {
    expect(splitTitle("Adrian Ursu (cântăreț)")).toEqual({
      title: "Adrian Ursu (cântăreț)",
      simple: "Adrian Ursu",
      special: "cântăreț",
    });
  });

  it("uses only the last qualifier group", () => {
    expect(splitTitle("A (B) (C)")).toEqual({
      title: "A (B) (C)",
      simple: "A (B)",
      special: "C",
    });
  });

  it("leaves plain titles untouched", () => {
    expect(splitTitle("Republica Moldova")).toEqual({ title: "Republica Moldova" });
  });

  it("ignores a title that is only a parenthesis group", () => {
    expect(splitTitle("(disambiguation)")).toEqual({ title: "(disambiguation)" });
  });
});

describe("removeNestedParentheses", () => {
  it("removes a simple group", () => {
    expect(removeNestedParentheses("Some text (remove. this, sfsd gds sfsdg) aha")).toBe(
      "Some text aha",
    );
  });

  it("removes nested groups", () => {
    expect(removeNestedParentheses("Some text (remove this (nested), sfsd gds sfsdg) aha")).toBe(
      "Some text aha",
    );
  });

  it("keeps unbalanced openings instead of swallowing the rest", () => {
    expect(removeNestedParentheses("Some text (remove this (nested, sfsd(??) gds sfsdg) aha")).toBe(
      "Some text (remove this aha",
    );
  });

  it("does not leave a space before punctuation", () => {
    expect(removeNestedParentheses("Adrian Ursu (n. 1983) , cântăreț")).toBe(
      "Adrian Ursu, cântăreț",
    );
  });

  it("handles astral characters without splitting surrogate pairs", () => {
    expect(removeNestedParentheses("a 😀 (b) c")).toBe("a 😀 c");
  });
});

describe("firstPhrase", () => {
  it("stops at the first boundary past the minimum length", () => {
    expect(firstPhrase("Some text. Another text.", 5)).toBe("Some text.");
    expect(firstPhrase("Some text? Another text.", 6)).toBe("Some text?");
    expect(firstPhrase("Some text! Another text.", 9)).toBe("Some text!");
  });

  it("skips boundaries that are too early", () => {
    expect(firstPhrase("? Some text! Another text.", 9)).toBe("? Some text!");
    expect(firstPhrase("Some text! Another text.", 12)).toBe("Some text! Another text.");
  });

  it("returns the whole text when no boundary is long enough", () => {
    expect(firstPhrase("no boundary here", 50)).toBe("no boundary here");
  });

  it("recognises CJK sentence punctuation", () => {
    expect(firstPhrase("これは文です。次の文です。", 5)).toBe("これは文です。");
  });

  it("is not affected by regex state across calls", () => {
    const text = "Some text. Another text.";
    expect(firstPhrase(text, 5)).toBe(firstPhrase(text, 5));
  });
});

describe("levenshtein", () => {
  it("computes the edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
  });
});

describe("similarity", () => {
  it("ignores case, punctuation and diacritics", () => {
    expect(similarity("Brașov", "brasov")).toBe(1);
    expect(similarity("", "")).toBe(1);
  });

  it("scores an abbreviated name well above an unrelated one", () => {
    const good = similarity("R. Moldova", "Republica Moldova");
    const bad = similarity("R. Moldova", "Forțele armate ale Republicii Moldova");
    expect(good).toBeGreaterThan(0.5);
    expect(good).toBeGreaterThan(bad);
  });
});

describe("wordsMatch", () => {
  it("accepts prefixes", () => {
    expect(wordsMatch("ursu", "ursul")).toBe(true);
    expect(wordsMatch("adrian", "adriana")).toBe(true);
  });

  it("accepts inflected endings", () => {
    expect(wordsMatch("moldova", "moldovei")).toBe(true);
    expect(wordsMatch("franta", "frantei")).toBe(true);
  });

  it("rejects words that only share a short prefix", () => {
    expect(wordsMatch("cat", "car")).toBe(false);
    expect(wordsMatch("moldova", "molecula")).toBe(false);
  });
});

describe("wordCoverage", () => {
  it("counts query words found in the text", () => {
    expect(wordCoverage("adrian ursu", "Adrian Ursu (cântăreț)")).toBe(1);
    expect(wordCoverage("adrian ursu moldova", "Adrian Ursu (cântăreț)")).toBeCloseTo(2 / 3);
    expect(wordCoverage("moldova", "Republica Moldovei")).toBe(1);
  });

  it("returns 0 for blank input on either side", () => {
    expect(wordCoverage("", "anything")).toBe(0);
    expect(wordCoverage("anything", "")).toBe(0);
  });
});
