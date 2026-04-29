import test from "ava";
import { find } from "./find";

test("should find titles by short name: R. Moldova -> Republica Moldova", async (t) => {
  const titles = await find("R. Moldova", "ro", { limit: 1 });
  t.is(titles.length, 1, "one title founded");
  t.is(titles[0]!.title, "Republica Moldova");
  t.regex(
    titles[0]!.about!,
    /^Republica Moldova este un stat situat (în|la) /,
  );
  t.true(0.5 < titles[0]!.titleScore!);
  t.true(0.1 < titles[0]!.score!);
});

test("should sort titles by tags", async (t) => {
  const name = "Adrian Ursu";
  const titles = await find(name + " moldova", "ro", { limit: 2 });

  t.is(titles.length, 2, "2 titles founded");

  t.is(titles[0]!.simple, name);
  t.is(titles[0]!.special, "cântăreț", "Adrian Ursu (cântăreț)");
  t.is(
    titles[0]!.about,
    "Adrian Ursu este un cântăreț, cantautor și prezentator TV din Republica Moldova",
  );
});

test("should (NOT?) find a complex title: Adrian Ursu (cântăreț)", async (t) => {
  const name = "Adrian Ursu cântăreț";
  const titles = await find(name, "ro", { limit: 2 });

  t.is(titles.length, 2, "2 title founded");

  t.is(titles[0]!.simple, "Adrian Ursu");
  t.is(titles[0]!.special, "cântăreț", "Adrian Ursu (cântăreț)");
  t.is(
    titles[0]!.about,
    "Adrian Ursu este un cântăreț, cantautor și prezentator TV din Republica Moldova",
  );
});

test("should not find Disambiguation titles: Moldova (dezambiguizare)", async (t) => {
  const name = "Moldova (dezambiguizare)";
  const titles = await find(name, "ro", { limit: 2 });

  t.is(titles.length, 0, "0 titles founded");
});

test("should find titles by abbreviation: PLDM", async (t) => {
  const name = "PLDM";
  const titles = await find(name, "ro", { limit: 2 });

  t.is(titles.length, 2, "2 title founded");
  t.is(titles[0]!.title, "Partidul Liberal Democrat din Moldova");
  t.is(
    titles[0]!.about,
    "Partidul Liberal Democrat din Moldova este o formațiune politică de centru-dreapta din Republica Moldova",
  );
});
