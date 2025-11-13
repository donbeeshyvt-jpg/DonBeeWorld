import { describe, expect, it } from "vitest";

import { calculateLevelFromExperience } from "../src/services/gatheringService";

describe("calculateLevelFromExperience", () => {
  it("returns level 1 for new players", () => {
    expect(calculateLevelFromExperience(0)).toBe(1);
    expect(calculateLevelFromExperience(99)).toBe(1);
  });

  it("scales progressively with experience gain", () => {
    expect(calculateLevelFromExperience(100)).toBeGreaterThanOrEqual(2);
    expect(calculateLevelFromExperience(500)).toBeGreaterThanOrEqual(3);
    expect(calculateLevelFromExperience(5_000)).toBeGreaterThanOrEqual(6);
  });

  it("caps at high levels without overflowing", () => {
    expect(calculateLevelFromExperience(1_000_000)).toBeLessThanOrEqual(120);
  });
});

