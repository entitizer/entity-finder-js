import createDebug from "debug";

import { toEntityPage } from "./entity.js";
import { fetchLimit, normalizeLimit, normalizeName } from "./options.js";
import type { EntityPage, FindTitlesOptions } from "./types.js";
import { normalizeText, wordCoverage } from "./text.js";
import { normalizeLang, prefixSearchPages } from "./wikipedia/api.js";

const debug = createDebug("entity-finder:find-titles");

/**
 * Finds entities with Wikipedia's *prefix* search, which matches from the start
 * of the title. Use it when the query already is an entity name; use
 * {@link find} for descriptive queries.
 *
 * Wikipedia's own ordering is preserved (it is title-aware and hard to beat for
 * prefixes); `tags` can pull context-matching results to the front.
 */
export async function findTitles(
  name: string,
  lang: string,
  options: FindTitlesOptions = {},
): Promise<EntityPage[]> {
  const query = normalizeName(name);
  const language = normalizeLang(lang);
  const limit = normalizeLimit(options.limit);
  const includeDisambiguation = options.includeDisambiguation ?? false;

  const pages = await prefixSearchPages(language, query, {
    ...options,
    limit: fetchLimit(limit, includeDisambiguation),
  });

  debug("findTitles(%s, %s) -> %d raw pages", query, language, pages.length);

  const entities = pages
    .map((page) => toEntityPage(page, query, language))
    .filter((entity) => includeDisambiguation || !entity.isDisambiguation);

  const ordered = orderByTags(entities, options.tags, options.orderByTagsLimit ?? limit);

  return ordered.slice(0, limit);
}

/**
 * Moves up to `maxBoosted` tag-matching entities to the front, best match
 * first, leaving the rest of the list in its original order.
 */
export function orderByTags(
  entities: EntityPage[],
  tags: string[] | string | undefined,
  maxBoosted: number,
): EntityPage[] {
  const tagList = (Array.isArray(tags) ? tags : tags ? [tags] : [])
    .map((tag) => normalizeText(tag))
    .filter((tag) => tag.length > 0);

  if (tagList.length === 0 || maxBoosted < 1) return entities;

  const scored = entities.map((entity, position) => ({
    entity,
    position,
    tagScore: tagScoreOf(entity, tagList),
  }));

  const boosted = scored
    .filter((item) => item.tagScore > 0)
    .toSorted((a, b) => b.tagScore - a.tagScore || a.position - b.position)
    .slice(0, maxBoosted);

  if (boosted.length === 0) return entities;

  const boostedEntities = new Set(boosted.map((item) => item.entity));

  debug(
    "ordered by tags %o -> %o",
    tagList,
    boosted.map((item) => item.entity.title),
  );

  return [
    ...boosted.map((item) => item.entity),
    ...entities.filter((entity) => !boostedEntities.has(entity)),
  ];
}

/** A tag in the title counts more than one that only shows up in the summary. */
function tagScoreOf(entity: EntityPage, tags: string[]): number {
  const summary = [entity.shortDescription, entity.about, entity.extract].filter(Boolean).join(" ");

  let score = 0;
  for (const tag of tags) {
    if (wordCoverage(tag, entity.title) === 1) score += 5;
    else if (summary && wordCoverage(tag, summary) === 1) score += 1;
  }

  return score;
}
