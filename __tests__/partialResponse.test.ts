import { listFieldsParam } from "../src/partialResponse.js";

describe("listFieldsParam", () => {
  it("sends nothing without fields", () => {
    expect(listFieldsParam(undefined)).toBeUndefined();
    expect(listFieldsParam(" , ")).toBeUndefined();
  });

  it("keeps the next link when the fields replace the default set", () => {
    expect(listFieldsParam("values.id, values.title")).toBe(
      "values.id,values.title,next"
    );
  });

  it("does not add next twice", () => {
    expect(listFieldsParam("next,values.id")).toBe("next,values.id");
  });

  it("leaves additive and subtractive fields alone", () => {
    expect(listFieldsParam("-values.rendered,+values.participants")).toBe(
      "-values.rendered,+values.participants"
    );
  });
});
