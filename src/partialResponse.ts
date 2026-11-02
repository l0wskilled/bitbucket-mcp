/**
 * The `fields` query param for a paginated list, or undefined when none was given.
 * A plain entry such as `values.id` replaces Bitbucket's default field set, which
 * would drop the `next` link that `all: true` follows, so `next` is added then.
 * Entries prefixed with `+` or `-` only adjust the default set and keep `next`.
 */
export function listFieldsParam(fields?: string): string | undefined {
  const entries = (fields ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (entries.length === 0) return undefined;

  const replacesDefaults = entries.some(
    (entry) => !entry.startsWith("+") && !entry.startsWith("-")
  );
  if (replacesDefaults && !entries.includes("next")) entries.push("next");
  return entries.join(",");
}
