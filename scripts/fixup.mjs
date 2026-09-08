// Marks each build output with its module format and makes the CLI executable,
// so `dist/cjs` keeps working inside a `"type": "module"` package.
import { chmod, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

await Promise.all([
  writeFile(join(dist, "esm", "package.json"), `${JSON.stringify({ type: "module" }, null, 2)}\n`),
  writeFile(
    join(dist, "cjs", "package.json"),
    `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
  ),
]);

await chmod(join(dist, "esm", "cli.js"), 0o755);
