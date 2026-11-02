import {
  joinWithLimit,
  shapeDiff,
  splitUnifiedDiff,
} from "../src/diffFilter.js";

const fileA = [
  "diff --git a/src/a.ts b/src/a.ts",
  "index 1111111..2222222 100644",
  "--- a/src/a.ts",
  "+++ b/src/a.ts",
  "@@ -1,2 +1,2 @@",
  "-const a = 1;",
  "+const a = 2;",
].join("\n");

const renamed = [
  "diff --git a/docs/old.md b/docs/new.md",
  "similarity index 90%",
  "rename from docs/old.md",
  "rename to docs/new.md",
  "--- a/docs/old.md",
  "+++ b/docs/new.md",
  "@@ -1 +1 @@",
  "-old",
  "+new",
].join("\n");

const deleted = [
  "diff --git a/src/gone.ts b/src/gone.ts",
  "deleted file mode 100644",
  "--- a/src/gone.ts",
  "+++ /dev/null",
  "@@ -1 +0,0 @@",
  "-gone",
].join("\n");

const binary = [
  "diff --git a/img/logo.png b/img/logo.png",
  "Binary files a/img/logo.png and b/img/logo.png differ",
].join("\n");

const diff = [fileA, renamed, deleted, binary].join("\n") + "\n";

describe("splitUnifiedDiff", () => {
  it("splits a diff into one section per file with its paths", () => {
    const sections = splitUnifiedDiff(diff);
    expect(sections.map(({ path, oldPath }) => ({ path, oldPath }))).toEqual([
      { path: "src/a.ts", oldPath: undefined },
      { path: "docs/new.md", oldPath: "docs/old.md" },
      { path: "src/gone.ts", oldPath: undefined },
      { path: "img/logo.png", oldPath: undefined },
    ]);
    expect(sections[0].text).toBe(fileA);
  });

  it("joins back to the original text", () => {
    expect(joinWithLimit(splitUnifiedDiff(diff))).toBe(diff);
  });

  it("keeps the commit headers of a patch as sections without a path", () => {
    const patch = [
      "From 0123456789abcdef0123456789abcdef01234567 Mon Sep 17 00:00:00 2001",
      "Subject: [PATCH] first",
      "",
      fileA,
      "From fedcba9876543210fedcba9876543210fedcba98 Mon Sep 17 00:00:00 2001",
      "Subject: [PATCH] second",
      "",
      deleted,
    ].join("\n");
    expect(splitUnifiedDiff(patch).map((section) => section.path)).toEqual([
      undefined,
      "src/a.ts",
      undefined,
      "src/gone.ts",
    ]);
  });
});

describe("shapeDiff", () => {
  it("returns the diff unchanged without options", () => {
    expect(shapeDiff(diff, {})).toBe(diff);
  });

  it("keeps only the files matching a path", () => {
    expect(shapeDiff(diff, { paths: ["src/a.ts"] })).toBe(fileA);
  });

  it("matches a directory given with a trailing slash", () => {
    const result = shapeDiff(diff, { paths: ["src/"] });
    expect(result).toContain("src/a.ts");
    expect(result).toContain("src/gone.ts");
    expect(result).not.toContain("docs/new.md");
  });

  it("matches a renamed file by its old path", () => {
    expect(shapeDiff(diff, { paths: ["docs/old.md"] })).toBe(renamed);
  });

  it("does not treat a path without trailing slash as a prefix", () => {
    expect(shapeDiff(diff, { paths: ["src/a"] })).toMatch(/^\[no file matches/);
  });

  it("lists the files when no path matches", () => {
    expect(shapeDiff(diff, { paths: ["nope.ts"] })).toBe(
      "[no file matches nope.ts. Files in this diff: src/a.ts, docs/new.md, src/gone.ts, img/logo.png]"
    );
  });

  it("keeps a patch's commit header with its matching file only", () => {
    const patch = [
      "From 0123456789abcdef0123456789abcdef01234567 Mon Sep 17 00:00:00 2001",
      "Subject: [PATCH] first",
      fileA,
      "From fedcba9876543210fedcba9876543210fedcba98 Mon Sep 17 00:00:00 2001",
      "Subject: [PATCH] second",
      deleted,
    ].join("\n");
    const result = shapeDiff(patch, { paths: ["src/gone.ts"] });
    expect(result).toContain("Subject: [PATCH] second");
    expect(result).not.toContain("Subject: [PATCH] first");
    expect(result).not.toContain("src/a.ts");
  });

  it("cuts at a line boundary and names the files not fully shown", () => {
    const result = shapeDiff(diff, { maxChars: fileA.length + 60 });
    const [shown, marker] = result.split("\n\n[truncated: ");
    expect(shown.startsWith(fileA)).toBe(true);
    expect(diff.startsWith(shown)).toBe(true);
    expect(marker).toBe(
      `showing ${shown.length} of ${diff.length} characters. Not fully shown: docs/new.md (cut), src/gone.ts, img/logo.png. Fetch them with path, or raise max_chars.]`
    );
  });

  it("leaves a file out entirely when the cut falls before its first line ends", () => {
    const result = shapeDiff(diff, { maxChars: fileA.length + 10 });
    expect(result.startsWith(`${fileA}\n\n[truncated: `)).toBe(true);
    expect(result).toContain("Not fully shown: docs/new.md, src/gone.ts");
  });

  it("lists at most 20 left-out files in the marker", () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      fileA.replace(/src\/a\.ts/g, `src/f${i}.ts`)
    ).join("\n");
    const result = shapeDiff(many, { maxChars: 10 });
    expect(result).toContain("src/f0.ts (cut), src/f1.ts");
    expect(result).toContain("src/f19.ts and 5 more.");
    expect(result).not.toContain("src/f20.ts");
  });

  it("names a file touched by several commits of a patch once", () => {
    const patch = [fileA, "From 0123456789abcdef0123456789abcdef01234567 Mon Sep 17 00:00:00 2001", fileA, fileA].join("\n");
    const result = shapeDiff(patch, { maxChars: 10 });
    expect(result).toContain("Not fully shown: src/a.ts (cut). Fetch");
  });

  it("does not truncate when the diff fits", () => {
    expect(shapeDiff(diff, { maxChars: diff.length })).toBe(diff);
  });

  it("applies the path filter before the limit", () => {
    expect(shapeDiff(diff, { paths: ["src/a.ts"], maxChars: fileA.length })).toBe(fileA);
  });
});
