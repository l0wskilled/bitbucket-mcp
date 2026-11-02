import { buildPipelineFilterParams } from "../src/pipelineFilters.js";

describe("buildPipelineFilterParams", () => {
  it("sends nothing without filters", () => {
    expect(buildPipelineFilterParams({})).toEqual({});
  });

  it("expands IN_PROGRESS to every stage of that state", () => {
    expect(buildPipelineFilterParams({ status: "IN_PROGRESS" })).toEqual({
      status: ["BUILDING", "QUEUED", "PAUSED", "HALTED"],
    });
  });

  it.each([
    ["RUNNING", "BUILDING"],
    ["SUCCESSFUL", "PASSED"],
    ["QUEUED", "QUEUED"],
    ["HALTED", "HALTED"],
    ["PENDING", "PENDING"],
    ["FAILED", "FAILED"],
    ["ERROR", "ERROR"],
    ["STOPPED", "STOPPED"],
    ["BUILDING", "BUILDING"],
    ["PASSED", "PASSED"],
    ["PAUSED", "PAUSED"],
    ["successful", "PASSED"],
  ])("maps status %s to the API value %s", (status, expected) => {
    expect(buildPipelineFilterParams({ status })).toEqual({ status: expected });
  });

  it.each([
    ["push", "PUSH"],
    ["manual", "MANUAL"],
    ["schedule", "SCHEDULED"],
    ["parent_step", "PARENT_STEP"],
    ["SCHEDULED", "SCHEDULED"],
  ])("maps trigger type %s to the API value %s", (triggerType, expected) => {
    expect(buildPipelineFilterParams({ triggerType })).toEqual({
      trigger_type: expected,
    });
  });

  it("filters pull request pipelines by their selector", () => {
    expect(buildPipelineFilterParams({ triggerType: "pullrequest" })).toEqual({
      "target.selector.type": "PULLREQUESTS",
    });
  });

  it("passes branch and sort through", () => {
    expect(
      buildPipelineFilterParams({
        status: "FAILED",
        targetBranch: " main ",
        sort: "-created_on",
      })
    ).toEqual({ status: "FAILED", "target.branch": "main", sort: "-created_on" });
  });
});
