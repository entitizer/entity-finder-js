import test from "ava";
import { firstPhrase, removeNestedParentheses } from "./utils";

test("removeNestedParentheses: simple", async (t) => {
  const text = removeNestedParentheses(
    "Some text (remove. this, sfsd gds sfsdg) aha"
  );

  t.is(text, "Some text aha");
});

test("removeNestedParentheses: nested", async (t) => {
  const text = removeNestedParentheses(
    "Some text (remove this (nested), sfsd gds sfsdg) aha"
  );

  t.is(text, "Some text aha");
});

test("removeNestedParentheses: nested, broken", async (t) => {
  const text = removeNestedParentheses(
    "Some text (remove this (nested, sfsd(??) gds sfsdg) aha"
  );

  t.is(text, "Some text (remove this aha");
});

test("firstPhrase: simple", async (t) => {
  const text = "Some text. Another text.";
  t.is(firstPhrase(text, 5), "Some text.");
});

test("firstPhrase: with question mark", async (t) => {
  const text = "Some text? Another text.";
  t.is(firstPhrase(text, 6), "Some text?");
});

test("firstPhrase: with exclamation mark", async (t) => {
  const text = "Some text! Another text.";
  t.is(firstPhrase(text, 9), "Some text!");
});

test("firstPhrase: start with ?", async (t) => {
  const text = "? Some text! Another text.";
  t.is(firstPhrase(text, 9), "? Some text!");
});

test("firstPhrase: start with longer", async (t) => {
  const text = "Some text! Another text.";
  t.is(firstPhrase(text, 12), "Some text! Another text.");
});
