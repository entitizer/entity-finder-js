import { PageTitle } from "./types";

const wikiData = require("wikipedia-data");

export function countWords(title: string): number {
  return title.split(/[\s-]+/g).length;
}

export function isWikidataId(id: string) {
  return /^Q\d+$/.test(id);
}

export function formatTitle(title: string): PageTitle {
  var result = /\(([^)]+)\)$/i.exec(title);
  const pageTitle: PageTitle = {
    title: title
  };
  if (result) {
    pageTitle.simple = pageTitle.title.substring(0, result.index).trim();
    pageTitle.special = result[1];
  }

  return pageTitle;
}

export function getDisambiguationName(lang: string): string {
  return wikiData.getDisambiguationNames()[lang];
}

export function removeNestedParentheses(text: string): string {
  const stack: number[] = [];
  const chars = text.split("");

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "(") {
      stack.push(i); // Track the position of opening parentheses
    } else if (chars[i] === ")") {
      if (stack.length > 0) {
        const start = stack.pop()!;
        // Remove content inside the parentheses
        for (let j = start; j <= i; j++) {
          chars[j] = ""; // Mark characters for removal
        }
      }
    }
  }

  return chars
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.])/g, "$1")
    .trim(); // Clean up extra spaces
}

/**
 * Smart 1st phrase. Works for any case: . ?, !, etc.
 * ? "? Hello, world! How are you?" -> "Hello, world"
 */
export function firstPhrase(text: string, min = 30): string {
  // Define sentence-ending punctuation marks for various languages
  const sentenceEndings = /[.!?¿¡,;]/g;

  let accumulatedText = "";
  let match;

  // Iterate through the text to find sentence-ending punctuation
  while ((match = sentenceEndings.exec(text)) !== null) {
    const endIndex = match.index + 1; // Include the punctuation in the phrase
    accumulatedText = text.slice(0, endIndex).trim();

    if (accumulatedText.length >= min) {
      return accumulatedText; // Return the phrase as soon as the length condition is met
    }
  }

  // If no phrase meets the condition, return the entire text
  return text;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function similarityScore(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1; // Both strings are empty
  const distance = levenshteinDistance(
    a.toLowerCase().trim(),
    b.toLowerCase().trim()
  );
  return (maxLen - distance) / maxLen;
}
