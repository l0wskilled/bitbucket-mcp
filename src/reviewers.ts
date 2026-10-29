export type ReviewerRef = { uuid: string } | { account_id: string };

export interface ExistingReviewer {
  uuid?: string;
  account_id?: string;
}

/**
 * Turns reviewer ids into the objects the Bitbucket API expects: a UUID in braces
 * (`{...}`) as `uuid`, anything else as an Atlassian `account_id`.
 */
export function toReviewerRefs(ids: string[]): ReviewerRef[] {
  return ids
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => (id.startsWith("{") ? { uuid: id } : { account_id: id }));
}

/**
 * The reviewer list for a PUT that keeps the current reviewers and adds new ones.
 * A PUT replaces the whole list, so the current reviewers have to be sent again.
 */
export function mergeReviewers(
  current: ExistingReviewer[],
  added: ReviewerRef[]
): ReviewerRef[] {
  const merged: ReviewerRef[] = current
    .filter((reviewer) => reviewer.uuid || reviewer.account_id)
    .map((reviewer) =>
      reviewer.uuid
        ? { uuid: reviewer.uuid }
        : { account_id: reviewer.account_id as string }
    );

  for (const ref of added) {
    const known = current.some((reviewer) =>
      "uuid" in ref
        ? reviewer.uuid === ref.uuid
        : reviewer.account_id === ref.account_id
    );
    const alreadyAdded = merged.some((existing) =>
      "uuid" in ref
        ? "uuid" in existing && existing.uuid === ref.uuid
        : "account_id" in existing && existing.account_id === ref.account_id
    );
    if (!known && !alreadyAdded) {
      merged.push(ref);
    }
  }

  return merged;
}
