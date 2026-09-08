// Keeps `src/version.ts` in sync with package.json; run by `npm version`.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const file = join(root, "src", "version.ts");
const source = await readFile(file, "utf8");
const updated = source.replace(
  /export const VERSION = "[^"]*";/,
  `export const VERSION = "${version}";`,
);

if (updated !== source) {
  await writeFile(file, updated);
  console.log(`src/version.ts -> ${version}`);
}
