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
