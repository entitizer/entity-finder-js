import { afterEach, describe, expect, it, vi } from "vitest";

import { main } from "../src/cli.js";
import { VERSION } from "../src/version.js";
import { adrianUrsuSinger, allAdrianUrsuPages } from "./helpers/fixtures.js";
import { mockFetch, queryResponse } from "./helpers/mock-fetch.js";

function captureOutput() {
  const out: string[] = [];
  const err: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    out.push(String(chunk));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    err.push(String(chunk));
    return true;
  });
  return { stdout: () => out.join(""), stderr: () => err.join("") };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("cli", () => {
  it("prints usage for --help", async () => {
    const output = captureOutput();
    await expect(main(["--help"])).resolves.toBe(0);
    expect(output.stdout()).toContain("Usage:");
  });

  it("prints the version", async () => {
    const output = captureOutput();
    await expect(main(["--version"])).resolves.toBe(0);
    expect(output.stdout().trim()).toBe(VERSION);
  });

  it("fails without a name or language", async () => {
    const output = captureOutput();
    await expect(main([])).resolves.toBe(1);
    expect(output.stderr()).toContain("required");
  });

  it("prints a human-readable result", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuSinger])]);
    vi.stubGlobal("fetch", mock.fetch);
    const output = captureOutput();

    await expect(main(["Adrian", "Ursu", "--lang", "ro"])).resolves.toBe(0);

    expect(output.stdout()).toContain("Adrian Ursu (cântăreț)");
    expect(output.stdout()).toContain("Q18548924");
    expect(mock.params().get("gsrsearch")).toBe("Adrian Ursu");
  });

  it("prints JSON with --json", async () => {
    const mock = mockFetch([queryResponse([adrianUrsuSinger])]);
    vi.stubGlobal("fetch", mock.fetch);
    const output = captureOutput();

    await main(["Adrian Ursu", "--lang", "ro", "--json"]);

    expect(JSON.parse(output.stdout())[0]).toMatchObject({ wikidataId: "Q18548924" });
  });

  it("uses prefix search and tags with --prefix", async () => {
    const mock = mockFetch([queryResponse(allAdrianUrsuPages)]);
    vi.stubGlobal("fetch", mock.fetch);
    captureOutput();

    await main(["Adrian Ursu", "-l", "ro", "-p", "-t", "moldova", "-n", "2"]);

    expect(mock.params().get("generator")).toBe("prefixsearch");
  });

  it("rejects a non-numeric limit instead of silently defaulting", async () => {
    const output = captureOutput();
    await expect(main(["x", "--lang", "ro", "--limit", "abc"])).resolves.toBe(1);
    expect(output.stderr()).toContain("--limit must be a positive integer");
  });

  it("reports when nothing was found", async () => {
    const mock = mockFetch([{ batchcomplete: true }]);
    vi.stubGlobal("fetch", mock.fetch);
    const output = captureOutput();

    await main(["zzzz", "--lang", "ro"]);

    expect(output.stdout()).toContain("No entities found.");
  });
});
