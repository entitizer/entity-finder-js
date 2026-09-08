/**
 * Latin letters that carry no combining mark and therefore survive NFD
 * decomposition, but that still need folding to their ASCII base form.
 */
const LATIN_SPECIAL_CHARS: ReadonlyMap<string, string> = new Map([
  ["ø", "o"],
  ["đ", "d"],
  ["ð", "d"],
  ["ł", "l"],
  ["ß", "ss"],
  ["æ", "ae"],
  ["œ", "oe"],
  ["þ", "th"],
  ["ı", "i"],
  ["ħ", "h"],
  ["ŋ", "n"],
  ["ƶ", "z"],
]);

const LATIN_SPECIAL_RE = new RegExp(`[${[...LATIN_SPECIAL_CHARS.keys()].join("")}]`, "gu");

/** A Latin base letter followed by one or more combining marks. */
const LATIN_WITH_MARKS_RE = /(\p{Script=Latin})(\p{Mn}+)/gu;

/**
 * Folds diacritics on **Latin** letters only: `Brașov` -> `Brasov`.
 *
 * Marks on non-Latin scripts are deliberately preserved, because there they are
 * usually meaning-bearing rather than decorative — stripping them would turn
 * Cyrillic `й` into `и`, and decomposing Hangul would explode single syllables
 * into separate jamo and wreck every length-based comparison.
 */
export function stripDiacritics(text: string): string {
  return text
    .toLowerCase()
    .replace(LATIN_SPECIAL_RE, (char) => LATIN_SPECIAL_CHARS.get(char) ?? char)
    .normalize("NFD")
    .replace(LATIN_WITH_MARKS_RE, "$1")
    .normalize("NFC");
}

/**
 * Case-, accent- and punctuation-insensitive form used for all comparisons:
 * `"R. Moldova"` -> `"r moldova"`.
 */
export function normalizeText(text: string): string {
  return stripDiacritics(text)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Splits a text into normalized words. Returns `[]` for blank input. */
export function words(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized.length === 0 ? [] : normalized.split(" ");
}

/** Number of words in a title, counting hyphenated parts separately. */
export function countWords(text: string): number {
  return words(text).length;
}

/**
 * Splits a Wikipedia title into its base name and its parenthesised
 * qualifier: `"Adrian Ursu (cântăreț)"` -> `{ simple, special }`.
 *
 * Only the *last* top-level parenthesis group is treated as the qualifier, so
 * `"Cliff Richard (1959 album)"` and `"A (B) (C)"` both behave sensibly.
 */
export function splitTitle(title: string): {
  title: string;
  simple?: string;
  special?: string;
} {
  const match = /\(([^()]+)\)\s*$/.exec(title);
  if (!match) return { title };

  const simple = title.slice(0, match.index).trim();
  const special = match[1]?.trim();
  if (simple.length === 0 || !special || special.length === 0) return { title };

  return { title, simple, special };
}

/**
 * Removes every balanced parenthesis group, including nested ones:
 * `"Adrian Ursu (n. 1983, Ialoveni) este un cântăreț"` ->
 * `"Adrian Ursu este un cântăreț"`.
 *
 * Unbalanced opening parentheses are left untouched, so partially broken input
 * degrades gracefully instead of swallowing the rest of the text.
 */
export function removeNestedParentheses(text: string): string {
  const chars = [...text];
  const openIndexes: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "(") {
      openIndexes.push(i);
    } else if (chars[i] === ")" && openIndexes.length > 0) {
      const start = openIndexes.pop() as number;
      for (let j = start; j <= i; j++) chars[j] = "";
    }
  }

  return chars
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.:!?])/g, "$1")
    .trim();
}

/** Punctuation that can end a phrase, across the scripts Wikipedia uses. */
const PHRASE_ENDINGS = /[.!?;,¿¡。．！？；、，]/gu;

/**
 * Returns the shortest leading phrase that is at least `minLength` characters
 * long, so a summary never gets cut off after a two-word clause.
 *
 * Falls back to the whole text when no phrase boundary is long enough.
 */
export function firstPhrase(text: string, minLength = 50): string {
  const endings = new RegExp(PHRASE_ENDINGS.source, PHRASE_ENDINGS.flags);
  let match: RegExpExecArray | null;

  while ((match = endings.exec(text)) !== null) {
    const phrase = text.slice(0, match.index + 1).trim();
    if (phrase.length >= minLength) return phrase;
  }

  return text;
}

/** Levenshtein edit distance, computed with two rolling rows. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: a.length + 1 }, (_, i) => i);
  let current: number[] = Array.from({ length: a.length + 1 }, () => 0);

  for (let i = 1; i <= b.length; i++) {
    current[0] = i;
    const bChar = b.charCodeAt(i - 1);
    for (let j = 1; j <= a.length; j++) {
      const cost = bChar === a.charCodeAt(j - 1) ? 0 : 1;
      current[j] = Math.min(
        (previous[j - 1] as number) + cost,
        (current[j - 1] as number) + 1,
        (previous[j] as number) + 1,
      );
    }
    [previous, current] = [current, previous];
  }

  return previous[a.length] as number;
}

/**
 * Normalized edit-distance similarity in `[0, 1]`, ignoring case, diacritics
 * and punctuation. `1` means the two strings are equal after normalization.
 */
export function similarity(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);
  const maxLength = Math.max(left.length, right.length);
  if (maxLength === 0) return 1;
  return (maxLength - levenshtein(left, right)) / maxLength;
}

/** Length of the longest common prefix of two strings. */
function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

/**
 * Whether two normalized words refer to the same thing.
 *
 * A plain prefix match covers `"ursu"` in `"ursul"`, but inflecting languages —
 * which is most of the wikis this package targets — also change the ending:
 * `"moldova"` vs `"moldovei"`. Those are accepted when the shared prefix is
 * long enough that the difference can only be an ending.
 */
export function wordsMatch(queryWord: string, textWord: string): boolean {
  if (textWord.startsWith(queryWord)) return true;

  const required = Math.max(MIN_STEM_LENGTH, queryWord.length - MAX_INFLECTION_LENGTH);
  return commonPrefixLength(queryWord, textWord) >= required;
}

/** Shortest prefix that may stand in for a whole word. */
const MIN_STEM_LENGTH = 4;
/** How many trailing characters an inflection is allowed to change. */
const MAX_INFLECTION_LENGTH = 2;

/**
 * Fraction of the query's words that appear in `text`, tolerating prefixes and
 * inflected endings. Returns `0` when either side has no words.
 */
export function wordCoverage(query: string, text: string): number {
  const queryWords = words(query);
  if (queryWords.length === 0) return 0;

  const textWords = words(text);
  if (textWords.length === 0) return 0;

  let hits = 0;
  for (const word of queryWords) {
    if (textWords.some((textWord) => wordsMatch(word, textWord))) hits++;
  }

  return hits / queryWords.length;
}
