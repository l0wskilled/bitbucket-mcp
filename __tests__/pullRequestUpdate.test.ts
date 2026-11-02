import { buildPullRequestUpdate } from "../src/pullRequestUpdate.js";

describe("buildPullRequestUpdate", () => {
  it("sends only the fields that were given", () => {
    expect(buildPullRequestUpdate({ title: "T" })).toEqual({ title: "T" });
    expect(buildPullRequestUpdate({})).toEqual({});
  });

  it("retargets the pull request onto the destination branch", () => {
    expect(buildPullRequestUpdate({ destinationBranch: " feat/x " })).toEqual({
      destination: { branch: { name: "feat/x" } },
    });
  });

  it("ignores an empty destination branch", () => {
    expect(buildPullRequestUpdate({ destinationBranch: "  " })).toEqual({});
  });

  it("converts reviewers into Bitbucket references", () => {
    expect(buildPullRequestUpdate({ reviewers: ["{a}", "1:b"] })).toEqual({
      reviewers: [{ uuid: "{a}" }, { account_id: "1:b" }],
    });
  });
});
