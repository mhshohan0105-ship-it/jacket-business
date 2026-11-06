import { describe, expect, it } from "vitest";
import {
  InputError,
  optionalDate,
  requireAmount,
  requireDecimalAmount,
  requireLines,
  requireSize,
  requireText,
} from "./validate";

describe("validate", () => {
  it("trims text and rejects blanks", () => {
    expect(requireText("  Rahim ", "নাম")).toBe("Rahim");
    expect(() => requireText("   ", "নাম")).toThrow(InputError);
  });

  it("accepts real dates only", () => {
    expect(optionalDate("")).toBeNull();
    expect(optionalDate("2026-11-07")).toBe("2026-11-07");
    expect(() => optionalDate("07/11/2026")).toThrow(InputError);
  });

  it("rejects bad amounts", () => {
    expect(requireAmount(0, "দাম")).toBe(0);
    expect(() => requireAmount(0, "সংখ্যা", 1)).toThrow(InputError);
    expect(() => requireAmount(-5, "দাম")).toThrow(InputError);
    expect(() => requireAmount(10.5, "দাম")).toThrow(InputError);
    expect(() => requireAmount("10", "দাম")).toThrow(InputError);
    expect(() => requireAmount(5_000_000_000, "দাম")).toThrow(InputError);
  });

  it("allows paisa on decimal amounts, and rejects bad ones", () => {
    expect(requireDecimalAmount(26.66672, "কুরিয়ার")).toBe(26.6667);
    expect(requireDecimalAmount(0, "কুরিয়ার")).toBe(0);
    expect(() => requireDecimalAmount(-1, "কুরিয়ার")).toThrow(InputError);
    expect(() => requireDecimalAmount(Number.NaN, "কুরিয়ার")).toThrow(InputError);
    expect(() => requireDecimalAmount("5", "কুরিয়ার")).toThrow(InputError);
  });

  it("only allows known sizes", () => {
    expect(requireSize("XXL")).toBe("XXL");
    expect(() => requireSize("S")).toThrow(InputError);
  });

  it("requires at least one line", () => {
    expect(() => requireLines([], (l) => l)).toThrow(InputError);
  });
});
