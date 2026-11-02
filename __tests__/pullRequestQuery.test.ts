import { buildPullRequestListParams } from "../src/pullRequestQuery.js";

describe("buildPullRequestListParams", () => {
  it("sends nothing without filters", () => {
    expect(buildPullRequestListParams()).toEqual({});
    expect(buildPullRequestListParams(undefined, "  ")).toEqual({});
  });

  it("sends the state param without a query", () => {
    expect(buildPullRequestListParams("OPEN")).toEqual({ state: "OPEN" });
  });

  it("passes the query through", () => {
    expect(buildPullRequestListParams(undefined, ' draft=false ')).toEqual({
      q: "draft=false",
    });
  });

  it("folds the state into the query", () => {
    expect(
      buildPullRequestListParams("MERGED", 'author.uuid="{a}" OR draft=true')
    ).toEqual({ q: '(author.uuid="{a}" OR draft=true) AND state="MERGED"' });
  });
});
