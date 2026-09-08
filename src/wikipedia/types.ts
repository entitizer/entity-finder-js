/** Page properties exposed through `prop=pageprops`. */
export interface WikiPageProps {
  /** Present (as an empty string) when the page is a disambiguation page. */
  disambiguation?: string;
  /** Wikidata entity id, e.g. `"Q18548924"`. */
  wikibase_item?: string;
  [key: string]: string | undefined;
}

/** A page as returned by `action=query&formatversion=2`. */
export interface WikiApiPage {
  pageid?: number;
  ns?: number;
  title: string;
  /** 1-based relevance position, present when a search generator was used. */
  index?: number;
  extract?: string;
  /** Short description, from Wikidata or a local `{{short description}}`. */
  description?: string;
  descriptionsource?: string;
  pageprops?: WikiPageProps;
  fullurl?: string;
  canonicalurl?: string;
  categories?: { ns: number; title: string }[];
  missing?: boolean;
}

/** Title rewriting applied by the API before resolving pages. */
export interface WikiTitleMapping {
  from: string;
  to: string;
}

export interface WikiQueryResponse {
  batchcomplete?: boolean;
  error?: { code: string; info: string };
  warnings?: Record<string, unknown>;
  continue?: Record<string, string>;
  query?: {
    pages?: WikiApiPage[];
    normalized?: WikiTitleMapping[];
    redirects?: WikiTitleMapping[];
  };
}
