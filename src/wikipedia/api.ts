import createDebug from "debug";

import { InvalidArgumentError, WikipediaApiError } from "../errors.js";
import { requestJson, type RequestOptions } from "../http.js";
import type { WikiApiPage, WikiQueryResponse } from "./types.js";

const debug = createDebug("entity-finder:api");

/**
 * Language codes accepted as a Wikipedia subdomain. Validated so a caller-supplied
 * value can never inject a different host into the request URL.
 */
const LANG_RE = /^[a-z]{2,3}(-[a-z\d]{2,8})*$/;

/**
 * `prop=extracts` returns at most 20 extracts per request, so every page query
 * is capped at 20 results — otherwise later pages would silently come back
 * without their summary.
 */
export const MAX_PAGES_PER_QUERY = 20;

export type QueryParams = Record<string, string | number | boolean | undefined>;

/** Normalizes and validates a language code, e.g. `" RO "` -> `"ro"`. */
export function normalizeLang(lang: string): string {
  const normalized = String(lang ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (!LANG_RE.test(normalized)) {
    throw new InvalidArgumentError(`Invalid Wikipedia language code: ${JSON.stringify(lang)}`);
  }

  return normalized;
}

/** Builds the full API URL for a wiki, dropping `undefined` parameters. */
export function buildApiUrl(lang: string, params: QueryParams): string {
  const url = new URL(`https://${normalizeLang(lang)}.wikipedia.org/w/api.php`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }

  return url.toString();
}

/**
 * Runs an `action=query` request and throws {@link WikipediaApiError} when the
 * API reports a failure in the body — MediaWiki answers those with HTTP 200.
 */
export async function query<T extends WikiQueryResponse>(
  lang: string,
  params: QueryParams,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildApiUrl(lang, {
    ...params,
    action: "query",
    format: "json",
    formatversion: 2,
    origin: "*",
  });

  const response = await requestJson<T>(url, options);

  if (response.error) {
    throw new WikipediaApiError({
      code: response.error.code,
      info: response.error.info,
      lang: normalizeLang(lang),
    });
  }

  if (response.warnings) debug("api warnings %o", response.warnings);

  return response;
}

/** Properties requested for every page lookup. */
const PAGE_PROPS: QueryParams = {
  prop: "extracts|pageprops|description|info",
  exintro: 1,
  explaintext: 1,
  exlimit: "max",
  ppprop: "disambiguation|wikibase_item",
  inprop: "url",
  redirects: 1,
};

function readPages(response: WikiQueryResponse): WikiApiPage[] {
  const pages = response.query?.pages ?? [];

  return pages
    .filter((page) => !page.missing && typeof page.title === "string")
    .toSorted(
      (a, b) => (a.index ?? Number.MAX_SAFE_INTEGER) - (b.index ?? Number.MAX_SAFE_INTEGER),
    );
}

export interface PageSearchOptions extends RequestOptions {
  /** Maximum number of pages to fetch. Clamped to {@link MAX_PAGES_PER_QUERY}. */
  limit?: number | undefined;
  /** Also request each page's non-hidden categories. */
  includeCategories?: boolean | undefined;
}

/** Adds `prop=categories` to the shared page properties when requested. */
function pageProps(includeCategories: boolean | undefined): QueryParams {
  if (!includeCategories) return PAGE_PROPS;

  return {
    ...PAGE_PROPS,
    prop: `${String(PAGE_PROPS["prop"])}|categories`,
    cllimit: "max",
    clshow: "!hidden",
  };
}

/**
 * Full-text search (`generator=search`): matches anywhere in the article, so it
 * finds entities from descriptive queries such as `"David the sculpture"`.
 */
export async function searchPages(
  lang: string,
  search: string,
  options: PageSearchOptions = {},
): Promise<WikiApiPage[]> {
  const limit = clampLimit(options.limit);

  const response = await query(
    lang,
    {
      ...pageProps(options.includeCategories),
      generator: "search",
      gsrsearch: search,
      gsrlimit: limit,
      gsrnamespace: 0,
    },
    options,
  );

  return readPages(response);
}

/**
 * Prefix search (`generator=prefixsearch`): matches from the beginning of the
 * title, which is what you want when the query already *is* an entity name.
 */
export async function prefixSearchPages(
  lang: string,
  search: string,
  options: PageSearchOptions = {},
): Promise<WikiApiPage[]> {
  const limit = clampLimit(options.limit);

  const response = await query(
    lang,
    {
      ...pageProps(options.includeCategories),
      generator: "prefixsearch",
      gpssearch: search,
      gpslimit: limit,
      gpsprofile: "fuzzy",
      gpsnamespace: 0,
    },
    options,
  );

  return readPages(response);
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return MAX_PAGES_PER_QUERY;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGES_PER_QUERY);
}
