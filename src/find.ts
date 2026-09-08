import createDebug from "debug";

import { byRelevance, toEntityPage } from "./entity.js";
import { fetchLimit, normalizeLimit, normalizeName } from "./options.js";
import type { EntityPage, FindOptions } from "./types.js";
import { normalizeLang, searchPages } from "./wikipedia/api.js";

const debug = createDebug("entity-finder:find");

/**
 * Finds entities with Wikipedia's full-text search, so descriptive queries
 * (`"democratic party thailand"`) work as well as bare names.
 *
 * Results are re-ranked by {@link EntityPage.score} and disambiguation pages are
 * removed unless `includeDisambiguation` is set.
 */
export async function find(
  name: string,
  lang: string,
  options: FindOptions = {},
): Promise<EntityPage[]> {
  const query = normalizeName(name);
  const language = normalizeLang(lang);
  const limit = normalizeLimit(options.limit);
  const includeDisambiguation = options.includeDisambiguation ?? false;

  const pages = await searchPages(language, query, {
    ...options,
    limit: fetchLimit(limit, includeDisambiguation),
  });

  debug("find(%s, %s) -> %d raw pages", query, language, pages.length);

  const entities = pages
    .map((page) => toEntityPage(page, query, language))
    .filter((entity) => includeDisambiguation || !entity.isDisambiguation)
    .toSorted(byRelevance)
    .slice(0, limit);

  debug("find(%s, %s) -> %d entities", query, language, entities.length);

  return entities;
}
