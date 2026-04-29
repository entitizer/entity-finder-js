import * as utils from "./utils";

// `atonic` is a CJS module without types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const atonic: { lowerCase(s: string): string } = require("atonic");

export function startsWith(text: string, start: string) {
  text = atonic
    .lowerCase(text.trim().toLowerCase())
    .replace(/[,-]+/g, " ")
    .trim();
  start = atonic
    .lowerCase(start.trim().toLowerCase())
    .replace(/[,-]+/g, " ")
    .trim();
  return text.indexOf(start) === 0;
}

export function containsWords(text: string, search: string) {
  text = atonic.lowerCase(text.trim().toLowerCase());
  search = atonic.lowerCase(search.trim().toLowerCase());
  const textWords = text.split(/[\s,-]+/g);
  const searchWords = search.split(/[\s,-]+/g);

  for (let word of searchWords) {
    if (!textWords.find((tw) => tw.startsWith(word))) {
      return false;
    }
  }
  return true;
}

export function filterOneWordName(name: string, title: string) {
  const wordsCount = utils.countWords(name);
  if (wordsCount === 1 && name.length !== title.length) {
    return false;
  }
  return true;
}

export function isAbbr(name: string, title: string) {
  // if (name === name.toUpperCase()) {
  const words = title.split(/[\s-]+/g);
  if (words.length >= name.length) {
    return true;
  }
  // }

  return false;
}

export function isComplex(name: string, title: string) {
  const titleParts = title.split(",");
  if (titleParts.length > 1) {
    title = titleParts[0];
    const wordsCount = utils.countWords(name);
    const titleWordsCount = utils.countWords(title);
    if (
      wordsCount === 1 &&
      titleWordsCount === 1 &&
      name.length === title.length
    ) {
      return true;
    }
    if (wordsCount > 1 && wordsCount === titleWordsCount) {
      return true;
    }
  }

  return false;
}
