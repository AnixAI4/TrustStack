import { describe, expect, it } from "vitest";
import { actionsOpenLabel, countNoun } from "./words.js";

describe("counts in plain words (Slice 10.5 B4, F4.2)", () => {
  it("one is singular, everything else plural — never \"1 actions\"", () => {
    expect(actionsOpenLabel(1)).toBe("1 action open");
    expect(actionsOpenLabel(0)).toBe("0 actions open");
    expect(actionsOpenLabel(4)).toBe("4 actions open");
    expect(countNoun(1, "action", "actions")).toBe("1 action");
    expect(countNoun(2, "action", "actions")).toBe("2 actions");
  });

  it("whole numbers in Indian grouping; a rate keeps its decimal and is plural", () => {
    expect(actionsOpenLabel(120000)).toBe("1,20,000 actions open");
    expect(countNoun(0.1, "action", "actions")).toBe("0.1 actions");
    expect(countNoun(1.5, "action", "actions")).toBe("1.5 actions");
  });
});
