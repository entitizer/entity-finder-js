"use strict";

import createDebug from "debug";

import * as wikiApi from "./wikipedia/api";
import { PageTitle } from "./types";
import { formatTitle, getDisambiguationName } from "./utils";

const debug = createDebug("entity-finder");

export interface SearchTitleOptions {
  limit?: number;
  tags?: string[] | string;
  orderByTagsLimit?: number;
  timeout?: number;
  headers?: { [key: string]: string };
}

export async function searchTitles(
  name: string,
  lang: string,
  options?: SearchTitleOptions,
): Promise<PageTitle[]> {
  lang = lang.trim().toLowerCase();
  options = options || {};
  name = name.trim();

  const limit = options.limit || 2;
  const openSearchOptions = {
    gpslimit: limit + 5,
    timeout: options.timeout || 1000 * 5,
  };
  const orderByTagsLimit = options.orderByTagsLimit || limit;

  const result = await wikiApi.prefixSearch(
    lang,
    name,
    openSearchOptions,
    options.headers || {},
  );

  const list = result.map<PageTitle>((item) => ({
    ...formatTitle(item.title),
    description: item.extract,
  }));
  debug("findTitles", name, lang, limit);

  const ordered = orderByTags(list, options.tags || [], orderByTagsLimit);

  debug("unfiltered titles", ordered);
  let titles: PageTitle[] = [];
  for (const title of ordered) {
    if (title.simple && title.special) {
      const disName = getDisambiguationName(lang);
      debug(`special name ${title.special} -> ${disName}`);
      if (disName && disName.toLowerCase() === title.special.toLowerCase()) {
        continue;
      }
    }

    titles.push(title);
  }

  titles = titles.slice(0, limit);
  debug("filterd titles", titles);
  return titles;
}

function orderByTags(
  list: PageTitle[],
  tags: string | string[],
  orderByTagsLimit: number,
): PageTitle[] {
  if (!tags) {
    return list;
  }
  if (!Array.isArray(tags)) {
    tags = [tags];
  }

  const regTags = tags.map(
    (tag) => new RegExp("(^|\\b)" + tag + "(\\b|$)", "i"),
  );

  debug(
    "Unordered by tags",
    list.map((item) => item.title),
    tags,
  );

  type Scored = PageTitle & { tempScore?: number };
  const selectedList = (list as Scored[])
    .filter((item, i) => {
      let score = 0;
      regTags.forEach((tag) => {
        if (tag.test(item.title)) {
          score += 5;
        }
        if (item.description && tag.test(item.description)) {
          score += 1;
        }
      });
      item.tempScore = score;
      if (score !== 0) {
        item.tempScore += list.length - i;
        return true;
      }
      return false;
    })
    .sort((a, b) => (b.tempScore || 0) - (a.tempScore || 0))
    .map((item) => {
      delete item.tempScore;
      return item;
    })
    .filter((_item, i) => i < orderByTagsLimit);

  if (selectedList.length) {
    list = list.filter(
      (item) => !selectedList.find((it) => it.title === item.title),
    );
    list = selectedList.concat(list);
  }

  debug(
    "Ordered by tags",
    list.map((item) => item.title),
  );

  return list;
}
