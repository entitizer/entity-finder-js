"use strict";

import createDebug from "debug";

import { searchWithExtracts } from "./wikipedia/api";
import { PageTitle } from "./types";
import {
  firstPhrase,
  formatTitle,
  getDisambiguationName,
  removeNestedParentheses,
  similarityScore,
} from "./utils";

const debug = createDebug("entity-finder");

export interface FindOptions {
  limit?: number;
  timeout?: number;
  headers?: { [key: string]: string };
}

export async function find(
  name: string,
  lang: string,
  options: FindOptions = {},
): Promise<PageTitle[]> {
  lang = lang.trim().toLowerCase();
  name = name.trim();

  const limit = options.limit || 2;

  const result = await searchWithExtracts(lang, name, options.headers || {}, {
    gsrlimit: limit,
    timeout: options.timeout,
  });

  if (!result || !result.query || !result.query.pages) return [];

  const list = Object.entries(result.query.pages)
    .map(([, value]) => value)
    .sort((a, b) => a.index - b.index)
    .map<PageTitle>((item) => ({
      ...formatTitle(item.title),
      description: removeNestedParentheses(item.extract),
      about: item.extract
        ? firstPhrase(removeNestedParentheses(item.extract), 50)
            .trim()
            .replace(/[.!?¿¡,;]$/, "")
            .trim()
        : undefined,
    }));

  list.forEach((item) => {
    item.titleScore = similarityScore(name, item.title);
    item.score = similarityScore(
      name,
      [item.title, item.about].filter(Boolean).join(" "),
    );
  });

  const disName = getDisambiguationName(lang);

  debug("unfiltered titles", list);
  const titles: PageTitle[] = [];
  for (const title of list) {
    if (title.simple && title.special) {
      debug(`special name ${title.special} -> ${disName}`);
      if (disName && disName.toLowerCase() === title.special.toLowerCase()) {
        continue;
      }
    }

    titles.push(title);
  }

  return titles;
}
