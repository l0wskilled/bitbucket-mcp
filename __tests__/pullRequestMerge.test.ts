import { buildPullRequestMerge, MERGE_STRATEGIES } from "../src/pullRequestMerge.js";

describe("buildPullRequestMerge", () => {
  it("offers the strategy names the Bitbucket API accepts", () => {
    expect(MERGE_STRATEGIES).toEqual([
      "merge_commit",
      "squash",
      "fast_forward",
      "squash_fast_forward",
      "rebase_fast_forward",
      "rebase_merge",
    ]);
  });

  it("passes the strategy through as merge_strategy", () => {
    expect(buildPullRequestMerge({ strategy: "merge_commit" })).toEqual({
      merge_strategy: "merge_commit",
    });
    expect(buildPullRequestMerge({ strategy: "fast_forward" })).toEqual({
      merge_strategy: "fast_forward",
    });
  });

  it("sends only the fields that were given", () => {
    expect(buildPullRequestMerge({})).toEqual({});
    expect(buildPullRequestMerge({ message: "M" })).toEqual({ message: "M" });
  });

  it("rejects a strategy the API does not know", () => {
    expect(() => buildPullRequestMerge({ strategy: "merge-commit" })).toThrow(
      /merge-commit/
    );
  });
});
