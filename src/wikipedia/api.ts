"use strict";

import request, { RequestOptions } from "../request";

const OPTIONS: RequestOptions = {
  params: {
    format: "json"
  }
};

/**
 * Create request options: url, qs, headers
 */
function createOptions(lang: string, qs: any): any {
  const options = {
    params: Object.assign({}, qs || {}, OPTIONS.params),
    url: "https://" + lang + ".wikipedia.org/w/api.php"
  };

  return options;
}

export function query(lang: string, qs: any = {}): Promise<any> {
  qs.action = "query";

  const { url, ...options } = createOptions(lang, qs);

  return request(url, options);
}

export function openSearch(
  lang: string,
  search: string,
  opts: {
    redirects?: string;
    limit?: number;
    profile?: string;
    timeout?: number;
  }
): any {
  opts = opts || {};

  const qs = {
    search: search,
    action: "opensearch",
    redirects: opts.redirects || "resolve",
    suggest: true,
    profile: opts.profile || "normal",
    limit: opts.limit || 10,
    timeout: opts.timeout
  };

  const { url, ...options } = createOptions(lang, qs);

  return request(url, options);
}

export async function prefixSearch(
  lang: string,
  name: string,
  options: { gpslimit?: number; timeout?: number } = {}
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
    redirects: 1
  };

  const results = await query(lang, qs);

  if (!results || !results.query || !results.query.pages) return [];

  return Object.keys(results.query.pages).map(
    (pageid) => results.query.pages[pageid]
  );
}

export function search(lang: string, srsearch: string): any {
  const qs = {
    srsearch: srsearch,
    list: "search",
    srprop: "size"
  };

  return query(lang, qs);
}
