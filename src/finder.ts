import { find } from "./find.js";
import { findTitles } from "./findTitles.js";
import { InvalidArgumentError } from "./errors.js";
import type { CommonFindOptions, EntityPage, FindOptions, FindTitlesOptions } from "./types.js";

export interface FinderDefaults extends CommonFindOptions {
  /** Default language, so call sites can omit it. */
  lang?: string | undefined;
  /** Default tags applied by {@link Finder.findTitles}. */
  tags?: string[] | string | undefined;
}

export interface Finder {
  find(name: string, lang?: string, options?: FindOptions): Promise<EntityPage[]>;
  findTitles(name: string, lang?: string, options?: FindTitlesOptions): Promise<EntityPage[]>;
}

/**
 * Binds a set of defaults — language, timeout, `User-Agent`, `fetch` — so they
 * do not have to be repeated at every call site.
 *
 * ```ts
 * const finder = createFinder({ lang: "ro", limit: 3, userAgent: "my-app/1.0 (https://example.com)" });
 * await finder.find("Adrian Ursu");
 * ```
 */
export function createFinder(defaults: FinderDefaults = {}): Finder {
  const { lang: defaultLang, ...defaultOptions } = defaults;

  const resolveLang = (lang: string | undefined): string => {
    const resolved = lang ?? defaultLang;
    if (!resolved) {
      throw new InvalidArgumentError(
        "`lang` is required — pass it to the call or to createFinder({ lang })",
      );
    }
    return resolved;
  };

  // `async` so a missing language rejects the returned promise instead of
  // throwing synchronously at the call site.
  return {
    async find(name, lang, options) {
      return find(name, resolveLang(lang), { ...defaultOptions, ...options });
    },
    async findTitles(name, lang, options) {
      return findTitles(name, resolveLang(lang), { ...defaultOptions, ...options });
    },
  };
}
