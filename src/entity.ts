import { isDisambiguationTitle } from "wikipedia-data";

import type { EntityPage } from "./types.js";
import {
  firstPhrase,
  removeNestedParentheses,
  similarity,
  splitTitle,
  wordCoverage,
} from "./text.js";
import type { WikiApiPage } from "./wikipedia/types.js";

/** Minimum length of the `about` summary before a phrase boundary is accepted. */
const ABOUT_MIN_LENGTH = 50;

/** Trailing punctuation trimmed from `about`, which is a fragment, not a sentence. */
const TRAILING_PUNCTUATION = /[.!?;,¿¡。．！？；、，]+$/u;

/**
 * How the relevance score is composed. Title similarity dominates, word
 * coverage rewards pages that actually mention the query, and Wikipedia's own
 * ranking breaks the remaining ties.
 */
const WEIGHTS = { title: 0.5, coverage: 0.3, rank: 0.2 } as const;

/**
 * Wikipedia flags disambiguation pages through `pageprops.disambiguation`, set
 * by the Disambiguator extension on every Wikimedia wiki. That signal is
 * authoritative and language-independent, so it decides on its own — a page
 * that reports *some* page properties but not this one is definitively not a
 * disambiguation page, whatever its title looks like.
 *
 * The localized title suffix is consulted only when the API returned no page
 * properties at all, i.e. when the authoritative answer is simply missing.
 * Keeping it that narrow matters: a suffix such as Tamil `(திரைப்படம்)` — "film"
 * — is common on disambiguation pages without being exclusive to them, so
 * trusting titles first would silently drop real articles.
 */
function detectDisambiguation(page: WikiApiPage, lang: string): boolean {
  if (page.pageprops !== undefined) return page.pageprops.disambiguation !== undefined;
  return isDisambiguationTitle(page.title, lang);
}

/** Search rank contribution: 1 for the top hit, decaying slowly after that. */
function rankScore(index: number | undefined): number {
  if (index === undefined || index < 1) return 0.5;
  return 1 / Math.sqrt(index);
}

/** Converts a raw API page into a scored {@link EntityPage}. */
export function toEntityPage(page: WikiApiPage, name: string, lang: string): EntityPage {
  const extract = page.extract?.trim() || undefined;
  const cleanExtract = extract ? removeNestedParentheses(extract) : undefined;
  const about = cleanExtract
    ? firstPhrase(cleanExtract, ABOUT_MIN_LENGTH).replace(TRAILING_PUNCTUATION, "").trim() ||
      undefined
    : undefined;

  const entity: EntityPage = {
    ...splitTitle(page.title),
    lang,
    pageId: page.pageid,
    url: page.canonicalurl ?? page.fullurl,
    wikidataId: page.pageprops?.wikibase_item,
    shortDescription: page.description?.trim() || undefined,
    extract,
    about,
    isDisambiguation: detectDisambiguation(page, lang),
    titleScore: 0,
    score: 0,
  };

  if (page.categories) {
    entity.categories = page.categories.map((category) => category.title);
  }

  entity.titleScore = similarity(name, entity.title);
  entity.score = scoreEntity(entity, name, page.index);

  return entity;
}

/** Blends title similarity, query-word coverage and Wikipedia's search rank. */
export function scoreEntity(entity: EntityPage, name: string, index: number | undefined): number {
  const haystack = [entity.title, entity.shortDescription, entity.about].filter(Boolean).join(" ");

  const score =
    WEIGHTS.title * entity.titleScore +
    WEIGHTS.coverage * wordCoverage(name, haystack) +
    WEIGHTS.rank * rankScore(index);

  return Math.round(score * 1e4) / 1e4;
}

/** Sorts by relevance, falling back to title similarity and then the API order. */
export function byRelevance(a: EntityPage, b: EntityPage): number {
  return b.score - a.score || b.titleScore - a.titleScore;
}
