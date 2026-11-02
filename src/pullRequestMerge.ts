/** The merge strategies as the Bitbucket API names them in `merge_strategy`. */
export const MERGE_STRATEGIES = [
  "merge_commit",
  "squash",
  "fast_forward",
  "squash_fast_forward",
  "rebase_fast_forward",
  "rebase_merge",
] as const;

export type MergeStrategy = (typeof MERGE_STRATEGIES)[number];

export interface PullRequestMerge {
  message?: string;
  merge_strategy?: MergeStrategy;
}

/** The body for a pull request merge, holding only the fields that were given. */
export function buildPullRequestMerge(fields: {
  message?: string;
  strategy?: string;
}): PullRequestMerge {
  const merge: PullRequestMerge = {};
  if (fields.message) merge.message = fields.message;
  if (fields.strategy !== undefined) {
    if (!(MERGE_STRATEGIES as readonly string[]).includes(fields.strategy)) {
      throw new Error(
        `Unknown merge strategy "${fields.strategy}", expected one of: ${MERGE_STRATEGIES.join(", ")}`
      );
    }
    merge.merge_strategy = fields.strategy as MergeStrategy;
  }
  return merge;
}
