"use strict";

import request, { RequestOptions } from "../request";

const OPTIONS: RequestOptions = {
  params: {
    format: "json",
  },
};

/**
 * Create request options: url, qs, headers
 */
function createOptions(
  lang: string,
  qs: Record<string, unknown>,
  headers: { [key: string]: string },
) {
  return {
    params: Object.assign({}, qs || {}, OPTIONS.params),
    url: "https://" + lang + ".wikipedia.org/w/api.php",
    headers: headers || {},
  };
}

export function query<T = any>(
  lang: string,
  headers: { [key: string]: string },
  qs: Record<string, unknown> = {},
): Promise<T> {
  qs.action = "query";

  const { url, ...options } = createOptions(lang, qs, headers);

  return request<T>(url, options);
}

export function openSearch(
  lang: string,
  search: string,
  opts: {
    redirects?: string;
    limit?: number;
    profile?: string;
    timeout?: number;
    headers?: { [key: string]: string };
  },
): Promise<any[]> {
  opts = opts || {};

  const qs = {
    search: search,
    action: "opensearch",
    redirects: opts.redirects || "resolve",
    suggest: true,
    profile: opts.profile || "normal",
    limit: opts.limit || 10,
  };

  const { url, ...options } = createOptions(lang, qs, opts.headers || {});

  return request(url, options);
}

export async function prefixSearch(
  lang: string,
  name: string,
  options: { gpslimit?: number; timeout?: number } = {},
  headers: { [key: string]: string } = {},
): Promise<{ pageid: number; title: string; extract: string }[]> {
  const qs = {
    ...options,
    action: "query",
    generator: "prefixsearch",
    gpssearch: name,
    gpsprofile: "normal",
    prop: "extracts",
    exintro: 1,
    explaintext: 1,
    redirects: 1,
  };

  const results = await query<{
    query?: {
      pages?: Record<
        string,
        { pageid: number; title: string; extract: string }
      >;
    };
  }>(lang, headers, qs);

  if (!results || !results.query || !results.query.pages) return [];

  const pages = results.query.pages;
  return Object.keys(pages).map((pageid) => pages[pageid]);
}

export function search(
  lang: string,
  srsearch: string,
  headers: { [key: string]: string },
) {
  const qs = {
    srsearch: srsearch,
    list: "search",
    srprop: "size",
  };

  return query(lang, headers, qs);
}

export function searchWithExtracts(
  lang: string,
  srsearch: string,
  headers: { [key: string]: string },
  options: Record<string, unknown>,
) {
  const qs = {
    gsrsearch: srsearch,
    generator: "search",
    prop: "extracts",
    exintro: 1,
    explaintext: 1,
    format: "json",
    utf8: 1,
  };

  return query<{
    query: {
      pages: Record<
        string,
        {
          pageid: number;
          ns: number;
          title: string;
          index: number;
          extract: string;
        }
      >;
    };
  }>(lang, headers, { ...options, ...qs });
}
