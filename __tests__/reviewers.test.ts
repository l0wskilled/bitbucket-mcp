import { mergeReviewers, toReviewerRefs } from "../src/reviewers.js";

describe("toReviewerRefs", () => {
  it("passes UUIDs in braces as uuid and everything else as account_id", () => {
    expect(
      toReviewerRefs([
        "{0debeee1-69f0-418f-baa8-d60a53ac19ea}",
        "712020:54c05adb-f2a7-4752-95fd-4c422925a0cd",
      ])
    ).toEqual([
      { uuid: "{0debeee1-69f0-418f-baa8-d60a53ac19ea}" },
      { account_id: "712020:54c05adb-f2a7-4752-95fd-4c422925a0cd" },
    ]);
  });

  it("trims entries and drops empty ones", () => {
    expect(toReviewerRefs([" {abc} ", "", "   "])).toEqual([{ uuid: "{abc}" }]);
  });
});

describe("mergeReviewers", () => {
  it("keeps the current reviewers and adds the new ones", () => {
    expect(
      mergeReviewers(
        [{ uuid: "{a}", account_id: "1:a" }],
        [{ uuid: "{b}" }]
      )
    ).toEqual([{ uuid: "{a}" }, { uuid: "{b}" }]);
  });

  it("adds no one twice, whether named by uuid or by account id", () => {
    expect(
      mergeReviewers(
        [{ uuid: "{a}", account_id: "1:a" }],
        [{ uuid: "{a}" }, { account_id: "1:a" }]
      )
    ).toEqual([{ uuid: "{a}" }]);
  });
});
