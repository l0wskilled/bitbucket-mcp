interface Account {
  display_name?: string;
}

interface PullRequestLike {
  type?: string;
  id?: number;
  title?: string;
  state?: string;
  draft?: boolean;
  source?: { branch?: { name?: string }; commit?: { hash?: string } };
  destination?: { branch?: { name?: string } };
  reviewers?: Account[];
  links?: { html?: { href?: string } };
}

interface ParticipantLike {
  type?: string;
  user?: Account;
  role?: string;
  approved?: boolean;
  state?: string | null;
}

export interface PullRequestSummary {
  id?: number;
  title?: string;
  state?: string;
  draft?: boolean;
  source_branch?: string;
  destination_branch?: string;
  source_commit?: string;
  reviewers: string[];
  url?: string;
}

/** The fields an agent needs after a pull request write, without descriptions or rendered HTML. */
export function summarizePullRequest(pr: PullRequestLike): PullRequestSummary {
  return {
    id: pr.id,
    title: pr.title,
    state: pr.state,
    draft: pr.draft,
    source_branch: pr.source?.branch?.name,
    destination_branch: pr.destination?.branch?.name,
    source_commit: pr.source?.commit?.hash,
    reviewers: (pr.reviewers ?? [])
      .map((reviewer) => reviewer.display_name)
      .filter((name): name is string => typeof name === "string"),
    url: pr.links?.html?.href,
  };
}

/**
 * The compact form of a write response: a pull request or a participant (what
 * approve and request-changes return) is summarized, anything else is kept.
 */
export function summarizeWriteResponse(data: unknown): unknown {
  if (data === null || typeof data !== "object") return data;
  const object = data as PullRequestLike & ParticipantLike;
  if (object.type === "pullrequest") return summarizePullRequest(object);
  if (object.type === "participant") {
    return {
      user: object.user?.display_name,
      role: object.role,
      approved: object.approved,
      state: object.state ?? null,
    };
  }
  return data;
}

const CONTENT_PREVIEW_CHARS = 200;

/** The raw text with whitespace collapsed, cut at a word boundary with an ellipsis when too long. */
export function previewContent(
  raw: string | undefined,
  maxChars: number = CONTENT_PREVIEW_CHARS
): string | undefined {
  if (raw === undefined) return undefined;
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

interface CommentLike {
  id?: number;
  content?: { raw?: string };
  inline?: { path?: string; from?: number | null; to?: number | null };
  parent?: { id?: number };
  resolution?: { created_on?: string; user?: Account } | null;
  pending?: boolean;
  deleted?: boolean;
  user?: Account;
  links?: { html?: { href?: string } };
}

export interface CommentSummary {
  id?: number;
  content?: string;
  inline?: { path?: string; from?: number; to?: number };
  parent_id?: number;
  resolved: boolean;
  pending?: boolean;
  author?: string;
  url?: string;
}

/** The fields an agent needs after a comment write: id, content preview, anchor, thread, state and link. */
export function summarizeComment(comment: CommentLike): CommentSummary {
  const summary: CommentSummary = {
    id: comment.id,
    content: previewContent(comment.content?.raw),
    resolved: Boolean(comment.resolution?.created_on),
    pending: comment.pending,
    author: comment.user?.display_name,
    url: comment.links?.html?.href,
  };
  if (comment.inline?.path) {
    summary.inline = { path: comment.inline.path };
    if (typeof comment.inline.from === "number") summary.inline.from = comment.inline.from;
    if (typeof comment.inline.to === "number") summary.inline.to = comment.inline.to;
  }
  if (comment.parent?.id !== undefined) summary.parent_id = comment.parent.id;
  return summary;
}

interface ResolutionLike {
  user?: Account;
  created_on?: string;
}

/** What resolving a comment thread returns: the thread root and who resolved it when. */
export function summarizeCommentResolution(
  commentId: string,
  resolution: ResolutionLike
): { comment_id: string; resolved: true; resolved_by?: string; resolved_on?: string } {
  return {
    comment_id: commentId,
    resolved: true,
    resolved_by: resolution.user?.display_name,
    resolved_on: resolution.created_on,
  };
}

interface TaskLike {
  id?: number;
  content?: { raw?: string };
  state?: string;
  pending?: boolean;
  comment?: { id?: number };
  creator?: Account;
  links?: { html?: { href?: string } };
}

export interface TaskSummary {
  id?: number;
  content?: string;
  state?: string;
  pending?: boolean;
  comment_id?: number;
  author?: string;
  url?: string;
}

/** The fields an agent needs after a task write: id, content preview, state, anchor comment and link. */
export function summarizeTask(task: TaskLike): TaskSummary {
  const summary: TaskSummary = {
    id: task.id,
    content: previewContent(task.content?.raw),
    state: task.state,
    pending: task.pending,
    author: task.creator?.display_name,
    url: task.links?.html?.href,
  };
  if (task.comment?.id !== undefined) summary.comment_id = task.comment.id;
  return summary;
}
