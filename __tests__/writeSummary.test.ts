import { summarizeWriteResponse } from "../src/writeSummary.js";

const pullRequest = {
  type: "pullrequest",
  id: 1088,
  title: "AD-6002: Export",
  description: "long text",
  rendered: { description: { html: "<p>long text</p>" } },
  summary: { raw: "long text", html: "<p>long text</p>" },
  state: "OPEN",
  draft: true,
  source: {
    branch: { name: "feat/AD-6002" },
    commit: { hash: "45592bc0fe75" },
    repository: { full_name: "epubli/epubli4" },
  },
  destination: { branch: { name: "main" }, commit: { hash: "decb4564332f" } },
  reviewers: [
    { display_name: "Sebastian Anklamm", uuid: "{a}" },
    { uuid: "{b}" },
  ],
  participants: [{ user: { display_name: "Hendrik" } }],
  links: {
    html: { href: "https://bitbucket.org/epubli/epubli4/pull-requests/1088" },
  },
};

describe("summarizeWriteResponse", () => {
  it("keeps only the summary fields of a pull request", () => {
    expect(summarizeWriteResponse(pullRequest)).toEqual({
      id: 1088,
      title: "AD-6002: Export",
      state: "OPEN",
      draft: true,
      source_branch: "feat/AD-6002",
      destination_branch: "main",
      source_commit: "45592bc0fe75",
      reviewers: ["Sebastian Anklamm"],
      url: "https://bitbucket.org/epubli/epubli4/pull-requests/1088",
    });
  });

  it("returns an empty reviewer list when the pull request has none", () => {
    expect(
      summarizeWriteResponse({ type: "pullrequest", id: 1 })
    ).toMatchObject({ id: 1, reviewers: [] });
  });

  it("summarizes a participant returned by approve", () => {
    expect(
      summarizeWriteResponse({
        type: "participant",
        user: { display_name: "Hendrik", links: {} },
        role: "REVIEWER",
        approved: true,
        state: "approved",
        participated_on: "2026-11-02T10:00:00Z",
      })
    ).toEqual({
      user: "Hendrik",
      role: "REVIEWER",
      approved: true,
      state: "approved",
    });
  });

  it("passes other responses through", () => {
    const merge = { task_status: "PENDING", links: {} };
    expect(summarizeWriteResponse(merge)).toBe(merge);
    expect(summarizeWriteResponse("done")).toBe("done");
  });
});
