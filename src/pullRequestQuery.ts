/**
 * The query params for listing pull requests. Bitbucket ignores the `state`
 * param once a `q` query is given, so the state is folded into the query then.
 */
export function buildPullRequestListParams(
  state?: string,
  q?: string
): Record<string, string> {
  const query = q?.trim();
  if (!query) return state ? { state } : {};
  return { q: state ? `(${query}) AND state="${state}"` : query };
}
