import { buildPullRequestCreate } from "../src/pullRequestCreate.js";

const base = {
  title: "AD-1: Title",
  description: "Text",
  sourceBranch: "feat/AD-1",
  targetBranch: "main",
};

describe("buildPullRequestCreate", () => {
  it("closes the source branch by default and leaves reviewers and draft out", () => {
    expect(buildPullRequestCreate(base)).toEqual({
      title: "AD-1: Title",
      description: "Text",
      source: { branch: { name: "feat/AD-1" } },
      destination: { branch: { name: "main" } },
      close_source_branch: true,
    });
  });

  it("keeps the source branch when asked", () => {
    expect(
      buildPullRequestCreate({ ...base, closeSourceBranch: false })
    ).toMatchObject({ close_source_branch: false });
  });

  it("accepts UUIDs and Atlassian account IDs as reviewers", () => {
    expect(
      buildPullRequestCreate({
        ...base,
        reviewers: ["{04776764-62c7}", "712020:54c05adb", " "],
      }).reviewers
    ).toEqual([{ uuid: "{04776764-62c7}" }, { account_id: "712020:54c05adb" }]);
  });

  it("sends no reviewer list when none is usable", () => {
    expect(buildPullRequestCreate({ ...base, reviewers: [""] })).not.toHaveProperty(
      "reviewers"
    );
  });

  it("marks the pull request as draft only when draft is true", () => {
    expect(buildPullRequestCreate({ ...base, draft: true }).draft).toBe(true);
    expect(buildPullRequestCreate({ ...base, draft: false })).not.toHaveProperty(
      "draft"
    );
  });
});
