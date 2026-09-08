import type { RequestOptions } from "./http.js";

/**
 * A Wikipedia page resolved for a name, enriched with the identifiers and
 * summaries that make it usable as a named entity.
 */
export interface EntityPage {
  /** Full Wikipedia title, e.g. `"Adrian Ursu (cântăreț)"`. */
  title: string;
  /** Title without its parenthesised qualifier, e.g. `"Adrian Ursu"`. */
  simple?: string | undefined;
  /** The parenthesised qualifier, e.g. `"cântăreț"`. */
  special?: string | undefined;
  /** Language code of the wiki the page comes from. */
  lang: string;
  /** Wikipedia page id. */
  pageId?: number | undefined;
  /** Canonical page URL. */
  url?: string | undefined;
  /** Wikidata entity id, e.g. `"Q18548924"`. */
  wikidataId?: string | undefined;
  /** One-line description from Wikidata or a local `{{short description}}`. */
  shortDescription?: string | undefined;
  /** Plain-text intro section of the article. */
  extract?: string | undefined;
  /** Compact summary: the first phrase of `extract`, parentheses removed. */
  about?: string | undefined;
  /** Non-hidden categories. Only present when `includeCategories` is set. */
  categories?: string[] | undefined;
  /** `true` when Wikipedia flags the page as a disambiguation page. */
  isDisambiguation: boolean;
  /** Similarity between the query and {@link EntityPage.title}, in `[0, 1]`. */
  titleScore: number;
  /**
   * Overall relevance in `[0, 1]`, blending title similarity, how many query
   * words the page mentions, and Wikipedia's own search rank.
   */
  score: number;
}

/**
 * @deprecated Renamed to {@link EntityPage} in v2. Note that the old
 * `description` field is now split into `extract` (full intro) and
 * `shortDescription` (one-liner).
 */
export type PageTitle = EntityPage;

/** Options shared by every lookup function. */
export interface CommonFindOptions extends RequestOptions {
  /** Maximum number of results. Default: `2`. Capped at 20. */
  limit?: number | undefined;
  /** Keep disambiguation pages in the results. Default: `false`. */
  includeDisambiguation?: boolean | undefined;
  /** Also fetch each page's non-hidden categories. Default: `false`. */
  includeCategories?: boolean | undefined;
}

export interface FindOptions extends CommonFindOptions {}

export interface FindTitlesOptions extends CommonFindOptions {
  /**
   * Words that boost a result when they appear in its title or summary — use
   * them to disambiguate by context, e.g. `tags: ["moldova"]`.
   */
  tags?: string[] | string | undefined;
  /** How many tag-boosted results may be pulled to the front. Default: `limit`. */
  orderByTagsLimit?: number | undefined;
}
