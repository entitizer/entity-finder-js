export { find } from "./find.js";
export { DEFAULT_LIMIT } from "./options.js";
export { findTitles, orderByTags } from "./findTitles.js";
export { createFinder, type Finder, type FinderDefaults } from "./finder.js";

export type {
  CommonFindOptions,
  EntityPage,
  FindOptions,
  FindTitlesOptions,
  PageTitle,
} from "./types.js";

export {
  DEFAULT_RETRIES,
  DEFAULT_RETRY_DELAY,
  DEFAULT_TIMEOUT,
  DEFAULT_USER_AGENT,
  type FetchLike,
  type RequestOptions,
} from "./http.js";

export {
  EntityFinderError,
  HttpError,
  InvalidArgumentError,
  TimeoutError,
  WikipediaApiError,
} from "./errors.js";

export {
  firstPhrase,
  normalizeText,
  removeNestedParentheses,
  similarity,
  splitTitle,
  stripDiacritics,
  wordCoverage,
} from "./text.js";

export * as wikipedia from "./wikipedia/api.js";
export type { WikiApiPage, WikiPageProps, WikiQueryResponse } from "./wikipedia/types.js";

export { VERSION } from "./version.js";
