"use strict";

const debug = require("debug")("entity-finder");

import { searchWithExtracts } from "./wikipedia/api";
import { PageTitle } from "./types";
import {
  firstPhrase,
  formatTitle,
  getDisambiguationName,
  removeNestedParentheses,
  similarityScore
} from "./utils";

export interface FindOptions {
  limit?: number;
}

export async function find(
  name: string,
  lang: string,
  options: FindOptions = {}
): Promise<PageTitle[]> {
  lang = lang.trim().toLowerCase();
  name = name.trim();

  const limit = options.limit || 2;

  const result = await searchWithExtracts(lang, name, {
    gsrlimit: limit
  });

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
        : undefined
    }));

  list.forEach((item) => {
    item.titleScore = similarityScore(name, item.title);
    item.score = similarityScore(
      name,
      [item.title, item.about].filter(Boolean).join(" ")
    );
  });

  const disName = getDisambiguationName(lang);

  debug("unfiltered titles", list);
  const titles: PageTitle[] = [];
  for (let i = 0; i < list.length; i++) {
    const title = list[i];

    if (title.simple) {
      debug(`special name ${title.special} -> ${disName}`);
      if (disName.toLowerCase() === title.special.toLowerCase()) {
        continue;
      }
    }

    titles.push(title);
  }

  return titles;
}
