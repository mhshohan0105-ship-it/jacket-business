import { describe, expect, it } from "vitest";
import { messages } from "./i18n/messages";
import {
  InputError,
  optionalDate,
  requireAmount,
  requireDecimalAmount,
  requireLines,
  requireSize,
  requireText,
} from "./validate";

function caught(work: () => unknown) {
  try {
    work();
  } catch (error) {
    if (error instanceof InputError) return error;
  }
  throw new Error("expected an InputError");
}

describe("validate", () => {
  it("trims text and rejects blanks", () => {
    expect(requireText("  Rahim ", "customer")).toBe("Rahim");
    expect(() => requireText("   ", "customer")).toThrow(InputError);
  });

  it("accepts real dates only", () => {
    expect(optionalDate("")).toBeNull();
    expect(optionalDate("2026-11-07")).toBe("2026-11-07");
    expect(() => optionalDate("07/11/2026")).toThrow(InputError);
  });

  it("rejects bad amounts", () => {
    expect(requireAmount(0, "sellPrice")).toBe(0);
    expect(() => requireAmount(0, "quantity", 1)).toThrow(InputError);
    expect(() => requireAmount(-5, "sellPrice")).toThrow(InputError);
    expect(() => requireAmount(10.5, "sellPrice")).toThrow(InputError);
    expect(() => requireAmount("10", "sellPrice")).toThrow(InputError);
    expect(() => requireAmount(5_000_000_000, "sellPrice")).toThrow(InputError);
  });

  it("allows paisa on decimal amounts, and rejects bad ones", () => {
    expect(requireDecimalAmount(26.66672, "courier")).toBe(26.6667);
    expect(requireDecimalAmount(0, "courier")).toBe(0);
    expect(() => requireDecimalAmount(-1, "courier")).toThrow(InputError);
    expect(() => requireDecimalAmount(Number.NaN, "courier")).toThrow(InputError);
    expect(() => requireDecimalAmount("5", "courier")).toThrow(InputError);
  });

  it("only allows known sizes", () => {
    expect(requireSize("XXL")).toBe("XXL");
    expect(() => requireSize("S")).toThrow(InputError);
  });

  it("requires at least one line", () => {
    expect(() => requireLines([], (l) => l)).toThrow(InputError);
  });

  it("explains problems in the viewer's language", () => {
    const error = caught(() => requireText("", "customer"));
    expect(error.render(messages.bn)).toBe("ক্রেতার নাম লিখুন");
    expect(error.render(messages.en)).toBe("Please enter the customer name");
  });
});

describe("messages", () => {
  // English must be in English: a missed translation would show Bengali letters.
  function strings(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (typeof value === "function") return strings(value("x", "y", "z", "w"));
    if (value && typeof value === "object") return Object.values(value).flatMap(strings);
    return [];
  }

  it("has no Bengali in the English text, apart from the switch back", () => {
    const { switchTo, ...rest } = messages.en;
    expect(switchTo).toBe("বাংলা");
    expect(strings(rest).filter((text) => /[ঀ-৿]/.test(text))).toEqual([]);
  });
});
