import { ReviewerRef, toReviewerRefs } from "./reviewers.js";

export interface PullRequestCreate {
  title: string;
  description: string;
  source: { branch: { name: string } };
  destination: { branch: { name: string } };
  close_source_branch: boolean;
  reviewers?: ReviewerRef[];
  draft?: true;
}

/**
 * The body for a pull request POST. The source branch is closed on merge unless
 * `closeSourceBranch` is false; reviewers and draft are sent only when given.
 */
export function buildPullRequestCreate(fields: {
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  reviewers?: string[];
  draft?: boolean;
  closeSourceBranch?: boolean;
}): PullRequestCreate {
  const create: PullRequestCreate = {
    title: fields.title,
    description: fields.description,
    source: { branch: { name: fields.sourceBranch } },
    destination: { branch: { name: fields.targetBranch } },
    close_source_branch: fields.closeSourceBranch ?? true,
  };
  const reviewers = toReviewerRefs(fields.reviewers ?? []);
  if (reviewers.length > 0) create.reviewers = reviewers;
  if (fields.draft === true) create.draft = true;
  return create;
}
