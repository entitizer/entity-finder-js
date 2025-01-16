"use strict";

const debug = require("debug")("entity-finder");

import * as wikiApi from "./wikipedia/api";
import { PageTitle } from "./types";
import { formatTitle, getDisambiguationName } from "./utils";

export interface SearchTitleOptions {
  limit?: number;
  tags?: string[] | string;
  orderByTagsLimit?: number;
  timeout?: number;
}

export function searchTitles(
  name: string,
  lang: string,
  options: SearchTitleOptions
): Promise<PageTitle[]> {
  lang = lang.trim().toLowerCase();
  options = options || {};
  name = name.trim();

  const limit = options.limit || 2;
  const openSearchOptions = {
    gpslimit: limit + 5,
    timeout: options.timeout || 1000 * 5
  };
  const orderByTagsLimit = options.orderByTagsLimit || limit;

  return wikiApi
    .prefixSearch(lang, name, openSearchOptions)
    .then((result) => {
      const list = result.map<PageTitle>((item) => ({
        ...formatTitle(item.title),
        description: item.extract
      }));
      debug("findTitles", name, lang, limit);
      return orderByTags(list, options.tags, orderByTagsLimit);
    })
    .then((list: PageTitle[]) => {
      debug("unfiltered titles", list);
      let titles = [];
      for (let i = 0; i < list.length; i++) {
        const title = list[i];

        if (title.simple) {
          const disName = getDisambiguationName(lang);
          debug(`special name ${title.special} -> ${disName}`);
          if (disName.toLowerCase() === title.special.toLowerCase()) {
            continue;
          }
        }

        titles.push(title);
      }

      titles = titles.slice(0, limit);
      debug("filterd titles", titles);
      return titles;
    });
}

function orderByTags(
  list: any[],
  tags: string | string[],
  orderByTagsLimit: number
): PageTitle[] {
  if (!tags) {
    return list;
  }
  if (!Array.isArray(tags)) {
    tags = [tags];
  }

  let regTags = tags.map((tag) => new RegExp("(^|\\b)" + tag + "(\\b|$)", "i"));

  // if (list.length > 1 && tags && tags.length > 0) {
  debug(
    "Unordered by tags",
    list.map((item) => item.title),
    tags
  );
  const selectedList = list
    .filter((item, i) => {
      let score = 0;
      regTags.forEach((tag) => {
        if (tag.test(item.title)) {
          score += 5;
        }
        if (tag.test(item.description)) {
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
    .sort((a, b) => {
      return b.tempScore - a.tempScore;
    })
    .map((item) => {
      delete item.tempScore;
      return item;
    })
    .filter((_item, i) => i < orderByTagsLimit);

  if (selectedList.length) {
    list = list.filter(
      (item) => !selectedList.find((it) => it.title === item.title)
    );
    list = selectedList.concat(list);
  }

  debug(
    "Ordered by tags",
    list.map((item) => item.title)
  );
  // }

  return list;
}
