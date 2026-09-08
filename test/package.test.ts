import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { VERSION } from "../src/version.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
  main: string;
  module: string;
  types: string;
  bin: Record<string, string>;
  files: string[];
  exports: Record<string, Record<string, Record<string, string>>>;
  engines: { node: string };
};

describe("package metadata", () => {
  it("keeps src/version.ts in sync with package.json", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("exposes matching ESM and CJS entry points", () => {
    const root = pkg.exports["."];
    expect(root?.["import"]).toEqual({
      types: "./dist/esm/index.d.ts",
      default: "./dist/esm/index.js",
    });
    expect(root?.["require"]).toEqual({
      types: "./dist/cjs/index.d.ts",
      default: "./dist/cjs/index.js",
    });
    expect(pkg.main).toBe(root?.["require"]?.["default"]);
    expect(pkg.module).toBe(root?.["import"]?.["default"]);
    expect(pkg.types).toBe(root?.["import"]?.["types"]);
  });

  it("ships the build plus the sources its source maps point at", () => {
    expect(pkg.files).toContain("dist");
    expect(pkg.files).toContain("src");
    expect(pkg.files).not.toContain("test");
  });

  it("points the bin at the ESM build", () => {
    // No leading "./": npm rewrites bin paths on publish and warns when it has to.
    expect(pkg.bin["entity-finder"]).toBe("dist/esm/cli.js");
  });

  it("requires a Node version with stable fetch and AbortSignal.any", () => {
    expect(pkg.engines.node).toBe(">=20.19.0");
  });
});
