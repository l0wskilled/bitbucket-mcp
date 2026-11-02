import {
  previewContent,
  summarizeComment,
  summarizeCommentResolution,
  summarizeTask,
} from "../src/writeSummary.js";

describe("previewContent", () => {
  it("collapses whitespace and keeps short text whole", () => {
    expect(previewContent("Line one\n\n  line two ")).toBe("Line one line two");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    expect(previewContent("alpha beta gamma delta", 15)).toBe("alpha beta…");
  });

  it("cuts inside a word when there is no late word boundary", () => {
    expect(previewContent("a".repeat(30), 10)).toBe(`${"a".repeat(10)}…`);
  });

  it("returns undefined without content", () => {
    expect(previewContent(undefined)).toBeUndefined();
  });
});

describe("summarizeComment", () => {
  const inlineReply = {
    id: 891507440,
    type: "pullrequest_comment",
    content: { raw: "Fixed 👍", markup: "markdown", html: "<p>Fixed 👍</p>" },
    user: { display_name: "Hendrik Knigge", uuid: "{u}", links: {} },
    inline: { from: null, to: 64, path: "src/EmailService.php", start_from: null },
    parent: { id: 891507400, links: {} },
    pending: false,
    deleted: false,
    resolution: {},
    pullrequest: { id: 1067, title: "long" },
    links: {
      html: { href: "https://bitbucket.org/epubli/epubli4/pull-requests/1067/_/diff#comment-891507440" },
      self: { href: "https://api.bitbucket.org/..." },
    },
  };

  it("keeps id, preview, anchor, parent, state, author and link", () => {
    expect(summarizeComment(inlineReply)).toEqual({
      id: 891507440,
      content: "Fixed 👍",
      inline: { path: "src/EmailService.php", to: 64 },
      parent_id: 891507400,
      resolved: false,
      pending: false,
      author: "Hendrik Knigge",
      url: "https://bitbucket.org/epubli/epubli4/pull-requests/1067/_/diff#comment-891507440",
    });
  });

  it("reports a resolved thread", () => {
    expect(
      summarizeComment({ id: 1, resolution: { created_on: "2026-11-02T10:00:00Z" } })
        .resolved
    ).toBe(true);
  });

  it("leaves inline and parent out of a general comment", () => {
    const summary = summarizeComment({ id: 2, content: { raw: "Hi" } });
    expect(summary).not.toHaveProperty("inline");
    expect(summary).not.toHaveProperty("parent_id");
  });
});

describe("summarizeCommentResolution", () => {
  it("names the thread root and who resolved it", () => {
    expect(
      summarizeCommentResolution("42", {
        type: "comment_resolution",
        user: { display_name: "Hendrik Knigge" },
        created_on: "2026-11-02T10:00:00Z",
      } as never)
    ).toEqual({
      comment_id: "42",
      resolved: true,
      resolved_by: "Hendrik Knigge",
      resolved_on: "2026-11-02T10:00:00Z",
    });
  });
});

describe("summarizeTask", () => {
  it("keeps id, preview, state, anchor comment, creator and link", () => {
    expect(
      summarizeTask({
        id: 7,
        content: { raw: "Add a test", html: "<p>Add a test</p>" },
        state: "UNRESOLVED",
        pending: false,
        comment: { id: 891507440 },
        creator: { display_name: "Sebastian Anklamm" },
        links: { html: { href: "https://bitbucket.org/x" } },
      } as never)
    ).toEqual({
      id: 7,
      content: "Add a test",
      state: "UNRESOLVED",
      pending: false,
      comment_id: 891507440,
      author: "Sebastian Anklamm",
      url: "https://bitbucket.org/x",
    });
  });
});
