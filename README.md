# entity-finder

[![npm](https://img.shields.io/npm/v/entity-finder.svg)](https://www.npmjs.com/package/entity-finder)

Resolve a name to the Wikipedia pages that most likely describe it — with the
**Wikidata id**, a short description and a one-phrase summary for each hit, and
disambiguation pages filtered out.

```ts
import { find } from "entity-finder";

const entities = await find("democratic party thailand", "en", { limit: 1 });
// [
//   {
//     title: "Democrat Party (Thailand)",
//     simple: "Democrat Party",
//     special: "Thailand",
//     lang: "en",
//     pageId: 866140,
//     url: "https://en.wikipedia.org/wiki/Democrat_Party_(Thailand)",
//     wikidataId: "Q1186248",
//     shortDescription: "Thai political party",
//     extract: "The Democrat Party (Thai: พรรคประชาธิปัตย์, RTGS: Phak Prachathipat …) is a …",
//     about: "The Democrat Party is a political party in Thailand",
//     isDisambiguation: false,
//     titleScore: 0.92,
//     score: 0.96,
//   },
// ]
```

- Zero HTTP dependencies — built on the platform `fetch`, so it also runs in
  Deno, Bun, Cloudflare Workers and the browser.
- Ships **ESM and CommonJS**, with types for both.
- Disambiguation pages are detected through Wikipedia's own
  `pageprops.disambiguation` flag, which works in every language.

## Install

```sh
npm install entity-finder
```

Requires Node.js **>= 20.19**.

## Usage

```ts
// ESM
import { find, findTitles, createFinder } from "entity-finder";

// CommonJS
const { find, findTitles, createFinder } = require("entity-finder");
```

### `find(name, lang, options?): Promise<EntityPage[]>`

Full-text search. Matches anywhere in the article, so descriptive queries work:
`"David the sculpture"`, `"democratic party thailand"`. Results are re-ranked by
[`score`](#ranking).

### `findTitles(name, lang, options?): Promise<EntityPage[]>`

Prefix search — matches from the start of the title, with fuzzy correction
(`"Brashov"` → `"Brașov"`). Use it when the query already _is_ an entity name.
Wikipedia's own ordering is kept, and `tags` can pull context matches to the
front:

```ts
await findTitles("Adrian Ursu", "ro", { limit: 2, tags: "moldova" });
// -> [ Adrian Ursu (cântăreț), Adrian Ursu (jurnalist) ]
```

### `createFinder(defaults?): Finder`

Binds defaults — language, limit, `User-Agent`, `timeout`, `fetch` — so they do
not have to be repeated:

```ts
const finder = createFinder({
  lang: "ro",
  limit: 3,
  userAgent: "my-app/1.0 (https://my.app)",
});

await finder.find("Chișinău");
await finder.findTitles("Adrian Ursu", "ro", { tags: "moldova" });
```

## Options

| Option                  | Type                     | Default   | Description                                                         |
| ----------------------- | ------------------------ | --------- | ------------------------------------------------------------------- |
| `limit`                 | `number`                 | `2`       | Maximum results. Capped at 20 (the API's extract limit).            |
| `includeDisambiguation` | `boolean`                | `false`   | Keep disambiguation pages.                                          |
| `includeCategories`     | `boolean`                | `false`   | Also fetch each page's non-hidden categories.                       |
| `tags`                  | `string \| string[]`     | —         | `findTitles` only: context words that boost matching results.       |
| `orderByTagsLimit`      | `number`                 | `limit`   | `findTitles` only: how many tag matches may be pulled to the front. |
| `timeout`               | `number`                 | `15000`   | Per-request timeout in ms.                                          |
| `retries`               | `number`                 | `2`       | Retries for timeouts, 429 and 5xx, with exponential backoff.        |
| `retryDelay`            | `number`                 | `300`     | Base backoff delay in ms.                                           |
| `signal`                | `AbortSignal`            | —         | Cancellation. Aborting is never retried.                            |
| `headers`               | `Record<string, string>` | —         | Extra request headers.                                              |
| `userAgent`             | `string`                 | see below | `User-Agent` sent to Wikimedia.                                     |
| `fetch`                 | `typeof fetch`           | global    | Custom transport, e.g. for tests or a proxy.                        |

### `User-Agent`

The [Wikimedia User-Agent policy](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy)
asks clients to identify themselves. This package defaults to
`entity-finder/<version> (https://github.com/entitizer/entity-finder-js)`; set
your own with the `userAgent` option or the `ENTITY_FINDER_USER_AGENT`
environment variable.

## `EntityPage`

```ts
interface EntityPage {
  title: string; // "Adrian Ursu (cântăreț)"
  simple?: string; // "Adrian Ursu"
  special?: string; // "cântăreț"
  lang: string; // "ro"
  pageId?: number;
  url?: string;
  wikidataId?: string; // "Q18548924"
  shortDescription?: string; // one-liner from Wikidata
  extract?: string; // plain-text intro section
  about?: string; // first phrase of `extract`, parentheses removed
  categories?: string[]; // only with `includeCategories`
  isDisambiguation: boolean;
  titleScore: number; // query vs. title similarity, 0..1
  score: number; // overall relevance, 0..1
}
```

### Ranking

`score` blends three signals, all normalized to `0..1`:

| Weight | Signal                                                                       |
| ------ | ---------------------------------------------------------------------------- |
| `0.50` | `titleScore` — edit-distance similarity, ignoring case, accents, punctuation |
| `0.30` | word coverage — how many query words the title/description mention           |
| `0.20` | Wikipedia's own search rank                                                  |

Comparisons fold Latin diacritics (`Brașov` ≡ `Brasov`) but deliberately keep
marks on other scripts, where they change the letter — Cyrillic `й` never
collapses to `и`, and Hangul syllables stay composed. Word matching tolerates
inflected endings, so `moldova` matches `Moldovei`.

## Errors

All errors extend `EntityFinderError`:

| Class                  | Thrown when                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `InvalidArgumentError` | Blank `name`, or a `lang` that is not a valid language code.      |
| `HttpError`            | Non-2xx response. Has `status`, `url`, `retryAfter`.              |
| `WikipediaApiError`    | HTTP 200 with an API `error` payload. Has `code`, `info`, `lang`. |
| `TimeoutError`         | Request exceeded `timeout`. Has `timeout`, `url`.                 |

## CLI

```sh
npx entity-finder "R. Moldova" --lang ro
npx entity-finder "Adrian Ursu" --lang ro --prefix --tags moldova --limit 2
npx entity-finder "Eiffel Tower" --lang en --json
```

Run `entity-finder --help` for all flags.

## Development

```sh
npm install
npm run check      # lint + format + typecheck + unit tests
npm test           # unit tests (no network)
npm run test:live  # integration tests against the real Wikipedia API
npm run build      # dual ESM + CJS build into dist/
```

Unit tests inject a `fetch` stub, so the whole suite runs offline and
deterministically. The live suite is opt-in, because its expectations depend on
current Wikipedia content.

## Changelog

### v2.0.0

A rewrite. The package is now ESM-first with a CommonJS build, has no runtime
HTTP dependency, and ships a CLI.

**Breaking**

- `PageTitle` is renamed `EntityPage` (the old name stays as a deprecated alias).
- `description` is gone. The full intro text is now `extract`; `description` as a
  name is taken by `shortDescription`, the Wikidata one-liner.
- `titleScore` and `score` are always present and are computed differently — see
  [Ranking](#ranking).
- `lang` is validated; an invalid code throws `InvalidArgumentError` instead of
  producing a request to a nonexistent host.
- A blank `name` throws `InvalidArgumentError` instead of searching for `""`.
- `findTitles` no longer makes a second request for categories; pass
  `includeCategories: true` to get them.
- Requires Node.js >= 20.19 and `wikipedia-data` >= 1.

**New**

- `wikidataId`, `shortDescription`, `url`, `pageId` and `isDisambiguation` on
  every result.
- `createFinder(defaults)` for reusable configuration.
- `entity-finder` CLI.
- `signal`, `retries`, `retryDelay`, `userAgent` and `fetch` options.
- Typed errors: `EntityFinderError`, `HttpError`, `WikipediaApiError`,
  `TimeoutError`, `InvalidArgumentError`.

**Fixed**

- `timeout` was being sent to Wikipedia as a _query parameter_ instead of being
  applied to the request, so no call ever timed out early and every URL carried a
  bogus `timeout=…`.
- Disambiguation filtering only worked in languages whose parenthetical suffix
  happens to equal the template name — it silently failed for `ru`, `uk`, `nl`,
  `ja`, `zh`, `sv` and others. It now uses Wikipedia's own
  `pageprops.disambiguation` flag, which is language-independent.
- `find` did not apply `limit` after filtering, so it could return more or fewer
  results than requested; it now over-fetches and slices.
- `findTitles` crashed with a `TypeError` when the API normalized or redirected a
  title, because the follow-up category lookup came back under a different title.
- API-level errors (HTTP 200 with an `error` body) were silently treated as empty
  results, or thrown as a raw JSON string.
- Results were ordered by the API response's object-key order rather than by
  relevance `index`.
- Titles like `"(disambiguation)"` and `"A (B) (C)"` were split incorrectly.
- `firstPhrase` and the similarity helpers now handle non-Latin scripts without
  mangling them.

### v1.0.0 - Apr 29, 2026

- modernize codebase: TypeScript strict mode, ES2020 target, Node `>=18`
- replace `require("debug")` with ES imports; bump `debug` to v4
- fix dropped headers in `wikipedia.openSearch` (typo `readers` → `headers`)
- fix `searchTitles` crashing when `description` is undefined
- fix `find` accidentally filtering primary results that lacked a `(special)` suffix
- request `User-Agent` is now derived from `package.json` (with contact URL) and
  overridable via `ENTITY_FINDER_USER_AGENT`
- convert promise chains in `findTitles` to `async/await`
- modernize `run.js` CLI (arg validation, error handling)

### v0.7.0 - Jan 16, 2025

- expose only `find` function

### v0.6.0 - May 31, 2021

- remove `wiki-entity` dependency
- remove `request` dependency

### v0.5.1 - March 21, 2018

- New option: `orderByTagsLimit` - Limits titles ordered by tags.

### v0.5.0 - March 17, 2018

- search only for titles
- updated API
- filters disambiguation titles
- updated `options` param

### v0.4.0 - March 18, 2017

- using module [wiki-entity](https://github.com/entitizer/wiki-entity-js)
- new results: returns an array of WikiEntity
- updated `options` param

### v0.3.0 - March 6, 2017

- TypeScript code
- **changed entity type**: `group` to `org`

### v0.2.0 - November 4, 2016

- node4
- new wikipedia parser: n3 - better performance
- added option: `tags`

## License

ISC © Dumitru Cantea
