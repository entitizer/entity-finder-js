#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { parseArgs } from "node:util";

import { find } from "./find.js";
import { findTitles } from "./findTitles.js";
import { EntityFinderError } from "./errors.js";
import type { EntityPage } from "./types.js";
import { VERSION } from "./version.js";

const DEFAULT_CLI_LIMIT = 5;

const USAGE = `entity-finder ${VERSION}

Usage:
  entity-finder <name> --lang <code> [options]

Options:
  -l, --lang <code>     Wikipedia language code (required), e.g. en, ro, ru
  -n, --limit <number>  Maximum number of results (default: 5, max 20)
  -p, --prefix          Use prefix search (findTitles) instead of full-text search
  -t, --tags <a,b>      Comma-separated context tags, only with --prefix
  -d, --disambiguation  Keep disambiguation pages
  -c, --categories      Also fetch page categories
      --json            Print raw JSON
  -h, --help            Show this help
  -v, --version         Show the version

Examples:
  entity-finder "R. Moldova" --lang ro
  entity-finder "democratic party thailand" --lang en --limit 3
  entity-finder "Adrian Ursu" --lang ro --prefix --tags moldova
`;

function formatEntity(entity: EntityPage): string {
  const header = `${entity.title}${entity.wikidataId ? `  [${entity.wikidataId}]` : ""}`;
  const lines = [
    header,
    `  score: ${entity.score.toFixed(3)} (title ${entity.titleScore.toFixed(3)})`,
  ];

  if (entity.shortDescription) lines.push(`  ${entity.shortDescription}`);
  if (entity.about) lines.push(`  ${entity.about}`);
  if (entity.url) lines.push(`  ${entity.url}`);

  return lines.join("\n");
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      lang: { type: "string", short: "l" },
      limit: { type: "string", short: "n" },
      prefix: { type: "boolean", short: "p" },
      tags: { type: "string", short: "t" },
      disambiguation: { type: "boolean", short: "d" },
      categories: { type: "boolean", short: "c" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  if (values.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const name = positionals.join(" ").trim();
  if (!name || !values.lang) {
    process.stderr.write(`${USAGE}\nError: <name> and --lang are both required.\n`);
    return 1;
  }

  const limit = values.limit === undefined ? DEFAULT_CLI_LIMIT : Number(values.limit);
  if (!Number.isInteger(limit) || limit < 1) {
    process.stderr.write(`Error: --limit must be a positive integer, got ${values.limit}\n`);
    return 1;
  }

  const options = {
    limit,
    includeDisambiguation: values.disambiguation ?? false,
    includeCategories: values.categories ?? false,
  };

  const entities = values.prefix
    ? await findTitles(name, values.lang, {
        ...options,
        tags: values.tags?.split(",").map((tag) => tag.trim()),
      })
    : await find(name, values.lang, options);

  if (values.json) {
    process.stdout.write(`${JSON.stringify(entities, null, 2)}\n`);
  } else if (entities.length === 0) {
    process.stdout.write("No entities found.\n");
  } else {
    process.stdout.write(`${entities.map(formatEntity).join("\n\n")}\n`);
  }

  return 0;
}

/**
 * True when this module is the process entry point. `process.argv[1]` points at
 * the npm bin symlink, so it has to be resolved before comparing.
 */
function isEntryPoint(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return realpathSync(entry) === import.meta.filename;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  void main().then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      const message = error instanceof EntityFinderError ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    },
  );
}
