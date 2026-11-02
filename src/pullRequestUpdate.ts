import { ReviewerRef, toReviewerRefs } from "./reviewers.js";

export interface PullRequestUpdate {
  title?: string;
  description?: string;
  reviewers?: ReviewerRef[];
  destination?: { branch: { name: string } };
}

/**
 * The body for a pull request PUT, holding only the fields that were given.
 * `destinationBranch` retargets the pull request onto that branch.
 */
export function buildPullRequestUpdate(fields: {
  title?: string;
  description?: string;
  reviewers?: string[];
  destinationBranch?: string;
}): PullRequestUpdate {
  const update: PullRequestUpdate = {};
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.reviewers !== undefined) update.reviewers = toReviewerRefs(fields.reviewers);
  const branch = fields.destinationBranch?.trim();
  if (branch) update.destination = { branch: { name: branch } };
  return update;
}
