"use strict";

import createDebug from "debug";

import * as wikiApi from "./wikipedia/api";
import { PageTitle } from "./types";
import { searchTitles, SearchTitleOptions } from "./searchTitles";
import { getDisambiguationName } from "./utils";

const debug = createDebug("entity-finder");

export interface FindTitleOptions extends SearchTitleOptions {}

export async function findTitles(
  name: string,
  lang: string,
  options?: FindTitleOptions,
): Promise<PageTitle[]> {
  options = options || {};
  name = name.trim();
  lang = (lang && lang.trim().toLowerCase()) || "en";

  const limit = options.limit || 2;
  const searchOptions: SearchTitleOptions = {
    limit: limit + 50,
    tags: options.tags,
    timeout: options.timeout,
    headers: options.headers,
  };

  let titles = await searchTitles(name, lang, searchOptions);
  titles = titles.slice(0, limit + 5);

  const filteredTitles = await filterDezambiguizationTitles(
    titles,
    lang,
    options.headers || {},
  );

  return titles
    .map((item) => filteredTitles.find((it) => it.title === item.title))
    .filter((item): item is PageTitle => !!item)
    .slice(0, limit);
}

async function filterDezambiguizationTitles(
  pageTitles: PageTitle[],
  lang: string,
  headers: { [key: string]: string },
): Promise<PageTitle[]> {
  if (pageTitles.length === 0) {
    return [];
  }

  const titles = pageTitles.map((item) => item.title).join("|");

  const data = await wikiApi.query(lang, headers, {
    titles: titles,
    prop: "categories",
    clshow: "!hidden",
    cllimit: 50,
  });

  if (!data.query) {
    throw new Error(JSON.stringify(data));
  }

  const pages: Record<
    string,
    { pageid: number; title: string; categories?: { title: string }[] }
  > = data.query.pages;

  return Object.keys(pages)
    .map((pageId) => ({
      pageid: pages[pageId].pageid,
      title: pages[pageId].title,
      categories:
        pages[pageId].categories &&
        pages[pageId].categories!.map((item) => item.title),
    }))
    .filter((item) => !hasADezambiguizationCategory(item.categories, lang))
    .map((item) => {
      const title = pageTitles.find((it) => it.title === item.title)!;
      title.categories = item.categories;
      return title;
    });
}

function hasADezambiguizationCategory(
  categories: string[] | undefined,
  lang: string,
) {
  return (
    !!categories &&
    categories.findIndex((category) =>
      isDezambiguizationCategory(category, lang),
    ) > -1
  );
}

function isDezambiguizationCategory(category: string, lang: string) {
  const disName = getDisambiguationName(lang);
  if (!disName) {
    throw new Error(`No Disambiguation Name for language ${lang}`);
  }
  const disNameReg = new RegExp("(^|\\b)" + disName + "(\\b|$)", "i");
  const isDis = disNameReg.test(category);
  if (isDis) {
    debug(`Category ${category} is a dizambiguization`);
  }
  return isDis;
}
