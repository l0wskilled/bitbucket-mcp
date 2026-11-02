import { overallBuildState, summarizeCommitStatus } from "../src/commitStatus.js";

describe("summarizeCommitStatus", () => {
  it("keeps state, key, name, url, commit hash and update time", () => {
    expect(
      summarizeCommitStatus({
        key: "branches:main",
        type: "build",
        state: "SUCCESSFUL",
        name: "Pipeline - branches: main",
        refname: "main",
        description: "long",
        url: "https://bitbucket.org/epubli/epubli4/pipelines/results/5000",
        commit: { hash: "812e2489eb6f", links: {} },
        created_on: "2026-11-02T09:00:00Z",
        updated_on: "2026-11-02T09:30:00Z",
        links: {},
      } as never)
    ).toEqual({
      state: "SUCCESSFUL",
      key: "branches:main",
      name: "Pipeline - branches: main",
      url: "https://bitbucket.org/epubli/epubli4/pipelines/results/5000",
      commit: "812e2489eb6f",
      updated_on: "2026-11-02T09:30:00Z",
    });
  });
});

describe("overallBuildState", () => {
  it("is NONE without builds", () => {
    expect(overallBuildState([])).toBe("NONE");
  });

  it("is SUCCESSFUL when every build passed", () => {
    expect(overallBuildState([{ state: "SUCCESSFUL" }, { state: "SUCCESSFUL" }])).toBe(
      "SUCCESSFUL"
    );
  });

  it("is INPROGRESS while a build runs and none failed", () => {
    expect(overallBuildState([{ state: "SUCCESSFUL" }, { state: "INPROGRESS" }])).toBe(
      "INPROGRESS"
    );
  });

  it("is FAILED when any build failed or was stopped", () => {
    expect(overallBuildState([{ state: "INPROGRESS" }, { state: "FAILED" }])).toBe("FAILED");
    expect(overallBuildState([{ state: "SUCCESSFUL" }, { state: "STOPPED" }])).toBe("FAILED");
  });
});
