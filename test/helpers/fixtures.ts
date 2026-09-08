import type { WikiApiPage } from "../../src/wikipedia/types.js";

/** Shapes captured from `ro.wikipedia.org` with `formatversion=2`. */
export const adrianUrsuDisambiguation: WikiApiPage = {
  pageid: 1226339,
  ns: 0,
  title: "Adrian Ursu",
  index: 1,
  extract: "Adrian Ursu poate fi:",
  description: "pagină de dezambiguizare Wikimedia",
  descriptionsource: "central",
  pageprops: { disambiguation: "", wikibase_item: "Q20819149" },
  canonicalurl: "https://ro.wikipedia.org/wiki/Adrian_Ursu",
};

export const adrianUrsuSinger: WikiApiPage = {
  pageid: 1226363,
  ns: 0,
  title: "Adrian Ursu (cântăreț)",
  index: 2,
  extract:
    "Adrian Ursu (Zis Lupu) (n. 31 august 1983, Ialoveni, Republica Moldova) este un cântăreț, cantautor și prezentator TV din Republica Moldova. Din 2013 este co-prezentator și gazdă a showului Moldova are talent alături de Mircea Marco.",
  description: "cântăreț din Republica Moldova",
  descriptionsource: "central",
  pageprops: { wikibase_item: "Q18548924" },
  canonicalurl: "https://ro.wikipedia.org/wiki/Adrian_Ursu_(c%C3%A2nt%C4%83re%C8%9B)",
};

export const adrianUrsuJournalist: WikiApiPage = {
  pageid: 873074,
  ns: 0,
  title: "Adrian Ursu (jurnalist)",
  index: 3,
  extract: "Adrian Ursu (n. 1968) este un jurnalist român, redactor-șef al ziarului Adevărul.",
  description: "jurnalist român",
  pageprops: { wikibase_item: "Q12724177" },
  canonicalurl: "https://ro.wikipedia.org/wiki/Adrian_Ursu_(jurnalist)",
};

export const moldovaAreTalent: WikiApiPage = {
  pageid: 1217087,
  ns: 0,
  title: "Moldova are talent",
  index: 4,
  extract:
    "Moldova are talent este un show de televiziune din Republica Moldova, care a debutat la postul de televiziune Prime.",
  description: "serial de televiziune (2013-2014)",
  pageprops: { wikibase_item: "Q15632221" },
  canonicalurl: "https://ro.wikipedia.org/wiki/Moldova_are_talent",
};

export const republicaMoldova: WikiApiPage = {
  pageid: 1946,
  ns: 0,
  title: "Republica Moldova",
  index: 1,
  extract:
    "Republica Moldova este un stat situat în sud-estul Europei, fără ieșire la mare, învecinat cu România și Ucraina.",
  description: "stat în Europa de Est",
  pageprops: { wikibase_item: "Q217" },
  canonicalurl: "https://ro.wikipedia.org/wiki/Republica_Moldova",
};

export const allAdrianUrsuPages = [
  adrianUrsuDisambiguation,
  adrianUrsuSinger,
  adrianUrsuJournalist,
  moldovaAreTalent,
];
