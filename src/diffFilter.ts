export interface DiffSection {
  /** The file's path in the new version, or the old path for a deleted file; absent for text between files. */
  path?: string;
  /** The file's path in the old version when it differs (rename or delete). */
  oldPath?: string;
  text: string;
}

const FILE_HEADER = /^diff --git /;
// Keeps the truncation marker short when hundreds of files are left out.
const MAX_LISTED_FILES = 20;
// git format-patch starts every commit with "From <40-hex sha> <date>".
const COMMIT_HEADER = /^From [0-9a-f]{40} /;

function stripPrefix(path: string): string | undefined {
  const trimmed = path.trim().replace(/^"(.*)"$/, "$1");
  if (trimmed === "/dev/null") return undefined;
  return trimmed.replace(/^[ab]\//, "");
}

function filePaths(lines: string[]): { path?: string; oldPath?: string } {
  let oldPath: string | undefined;
  let newPath: string | undefined;
  for (const line of lines) {
    if (line.startsWith("--- ")) oldPath = stripPrefix(line.slice(4));
    else if (line.startsWith("+++ ")) newPath = stripPrefix(line.slice(4));
    else if (line.startsWith("rename from ")) oldPath = line.slice(12).trim();
    else if (line.startsWith("rename to ")) newPath = line.slice(10).trim();
    else if (line.startsWith("@@")) break;
  }
  if (newPath === undefined && oldPath === undefined) {
    // Binary files and pure mode changes carry the paths only in the header line.
    const match = lines[0]?.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (match) {
      oldPath = match[1];
      newPath = match[2];
    }
  }
  const path = newPath ?? oldPath;
  return oldPath !== undefined && oldPath !== path ? { path, oldPath } : { path };
}

/**
 * Splits a unified diff or a git format-patch into one section per file. Text
 * outside a file (commit headers of a patch) becomes a section without a path.
 */
export function splitUnifiedDiff(diff: string): DiffSection[] {
  const sections: DiffSection[] = [];
  let current: string[] = [];
  let isFile = false;

  const flush = () => {
    if (current.length === 0) return;
    const text = current.join("\n");
    sections.push(isFile ? { ...filePaths(current), text } : { text });
    current = [];
  };

  for (const line of diff.split("\n")) {
    if (FILE_HEADER.test(line)) {
      flush();
      isFile = true;
    } else if (COMMIT_HEADER.test(line)) {
      flush();
      isFile = false;
    }
    current.push(line);
  }
  flush();
  return sections;
}

/** Whether a file matches one of the filters: the exact path, or a directory given with a trailing slash. */
export function matchesPath(section: DiffSection, filters: string[]): boolean {
  const paths = [section.path, section.oldPath].filter(
    (path): path is string => path !== undefined
  );
  return filters.some((filter) =>
    paths.some((path) =>
      filter.endsWith("/") ? path.startsWith(filter) : path === filter
    )
  );
}

/**
 * The sections of the files that match the filters. Text outside a file (a
 * commit header) is kept when a file it introduces matches.
 */
export function filterSections(
  sections: DiffSection[],
  filters: string[]
): DiffSection[] {
  const result: DiffSection[] = [];
  let pendingHeaders: DiffSection[] = [];
  for (const section of sections) {
    if (section.path === undefined && section.oldPath === undefined) {
      pendingHeaders = [section];
      continue;
    }
    if (matchesPath(section, filters)) {
      result.push(...pendingHeaders, section);
      pendingHeaders = [];
    }
  }
  return result;
}

/**
 * Joins the sections, cut at a line boundary once maxChars is reached. A marker
 * at the end names the character counts and the files that were cut or left out.
 */
export function joinWithLimit(sections: DiffSection[], maxChars?: number): string {
  const full = sections.map((section) => section.text).join("\n");
  if (maxChars === undefined || maxChars <= 0 || full.length <= maxChars) {
    return full;
  }

  let shown = full.slice(0, maxChars);
  const lastNewline = shown.lastIndexOf("\n");
  if (lastNewline > 0) shown = shown.slice(0, lastNewline);

  const notShown: string[] = [];
  const named = new Set<string>();
  let offset = 0;
  for (const section of sections) {
    const end = offset + section.text.length;
    // A patch can touch the same file in several commits; name it once.
    if (section.path !== undefined && end > shown.length && !named.has(section.path)) {
      named.add(section.path);
      notShown.push(offset < shown.length ? `${section.path} (cut)` : section.path);
    }
    offset = end + 1;
  }

  const listed =
    notShown.length > MAX_LISTED_FILES
      ? `${notShown.slice(0, MAX_LISTED_FILES).join(", ")} and ${notShown.length - MAX_LISTED_FILES} more`
      : notShown.join(", ");
  return `${shown}\n\n[truncated: showing ${shown.length} of ${full.length} characters. Not fully shown: ${listed}. Fetch them with path, or raise max_chars.]`;
}

/** The diff restricted to the given paths and cut to maxChars, or a hint listing the files when no path matches. */
export function shapeDiff(
  diff: string,
  options: { paths?: string[]; maxChars?: number }
): string {
  const filters = (options.paths ?? [])
    .map((path) => path.trim())
    .filter((path) => path.length > 0);
  let sections = splitUnifiedDiff(diff);

  if (filters.length > 0) {
    const all = sections;
    sections = filterSections(all, filters);
    if (sections.length === 0) {
      const files = all
        .map((section) => section.path)
        .filter((path): path is string => path !== undefined);
      return `[no file matches ${filters.join(", ")}. Files in this diff: ${files.join(", ")}]`;
    }
  }

  return joinWithLimit(sections, options.maxChars);
}
