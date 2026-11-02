/**
 * Status values offered by listPipelineRuns: the state, stage and result names a
 * pipeline carries in its response, plus the API's own BUILDING and PASSED.
 */
export const PIPELINE_STATUS_FILTERS = [
  "PENDING",
  "IN_PROGRESS",
  "RUNNING",
  "QUEUED",
  "PAUSED",
  "HALTED",
  "SUCCESSFUL",
  "FAILED",
  "ERROR",
  "STOPPED",
  "PARSING",
  "BUILDING",
  "PASSED",
] as const;

export type PipelineStatusFilter = (typeof PIPELINE_STATUS_FILTERS)[number];

export const PIPELINE_TRIGGER_FILTERS = [
  "push",
  "manual",
  "schedule",
  "parent_step",
  "pullrequest",
] as const;

export type PipelineTriggerFilter = (typeof PIPELINE_TRIGGER_FILTERS)[number];

/**
 * The `status` query param of GET /pipelines takes PARSING, PENDING, PAUSED,
 * HALTED, BUILDING, ERROR, PASSED, FAILED, STOPPED, UNKNOWN and the undocumented
 * QUEUED, not the names a pipeline carries in its response. It can be repeated.
 * IN_PROGRESS covers every stage of that state: running, queued, paused, halted.
 */
const STATUS_TO_API: Record<string, string[]> = {
  IN_PROGRESS: ["BUILDING", "QUEUED", "PAUSED", "HALTED"],
  RUNNING: ["BUILDING"],
  SUCCESSFUL: ["PASSED"],
};

/** The `trigger_type` query param accepts PUSH, MANUAL, SCHEDULED and PARENT_STEP. */
const TRIGGER_TO_API: Record<string, string> = {
  PUSH: "PUSH",
  MANUAL: "MANUAL",
  SCHEDULE: "SCHEDULED",
  SCHEDULED: "SCHEDULED",
  PARENT_STEP: "PARENT_STEP",
};

/**
 * The query params for GET /repositories/{workspace}/{repo_slug}/pipelines; a
 * list value is sent as a repeated param. Pull request pipelines are triggered
 * by a push, so `pullrequest` filters on the `pull-requests` selector of
 * bitbucket-pipelines.yml instead of a trigger type.
 */
export function buildPipelineFilterParams(filters: {
  status?: string;
  triggerType?: string;
  targetBranch?: string;
  sort?: string;
}): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};

  const status = filters.status?.trim().toUpperCase();
  if (status) {
    const values = STATUS_TO_API[status] ?? [status];
    params.status = values.length === 1 ? values[0] : values;
  }

  const trigger = filters.triggerType?.trim().toUpperCase();
  if (trigger === "PULLREQUEST" || trigger === "PULLREQUESTS") {
    params["target.selector.type"] = "PULLREQUESTS";
  } else if (trigger) {
    params.trigger_type = TRIGGER_TO_API[trigger] ?? trigger;
  }

  const branch = filters.targetBranch?.trim();
  if (branch) params["target.branch"] = branch;

  const sort = filters.sort?.trim();
  if (sort) params.sort = sort;

  return params;
}
