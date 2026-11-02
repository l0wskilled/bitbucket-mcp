export interface CommitStatusLike {
  state?: string;
  key?: string;
  name?: string;
  url?: string;
  commit?: { hash?: string };
  updated_on?: string;
}

export interface CommitStatusSummary {
  state?: string;
  key?: string;
  name?: string;
  url?: string;
  commit?: string;
  updated_on?: string;
}

export type OverallBuildState = "FAILED" | "INPROGRESS" | "SUCCESSFUL" | "NONE";

/** A build status reduced to what tells whether and where a build ran. */
export function summarizeCommitStatus(status: CommitStatusLike): CommitStatusSummary {
  return {
    state: status.state,
    key: status.key,
    name: status.name,
    url: status.url,
    commit: status.commit?.hash,
    updated_on: status.updated_on,
  };
}

/**
 * One state for all builds of a commit: FAILED when any failed or was stopped,
 * otherwise INPROGRESS while any runs, SUCCESSFUL when all passed, NONE without builds.
 */
export function overallBuildState(statuses: CommitStatusLike[]): OverallBuildState {
  if (statuses.length === 0) return "NONE";
  const states = statuses.map((status) => status.state);
  if (states.some((state) => state === "FAILED" || state === "STOPPED")) return "FAILED";
  if (states.every((state) => state === "SUCCESSFUL")) return "SUCCESSFUL";
  return "INPROGRESS";
}
