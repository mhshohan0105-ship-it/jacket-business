import { SIZES } from "./constants";
import type { Messages } from "./i18n/messages";

export type Field = keyof Messages["fields"];

/** A problem to show the user, written in whichever language they are using. */
export class InputError extends Error {
  constructor(readonly render: (t: Messages) => string) {
    super("Invalid input");
  }
}

export function requireText(value: unknown, field: Field) {
  const text = optionalText(value);
  if (!text) throw new InputError((t) => t.errors.enter(t.fields[field]));
  return text;
}

export function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function requireDate(value: unknown, field: Field) {
  const date = optionalDate(value);
  if (!date) throw new InputError((t) => t.errors.give(t.fields[field]));
  return date;
}

export function optionalDate(value: unknown) {
  if (typeof value !== "string" || value === "") return null;
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  if (!valid) throw new InputError((t) => t.errors.invalidDate);
  return value;
}

// Keeps values well inside Postgres' 32-bit integer columns.
const MAX_AMOUNT = 100_000_000;

export function requireAmount(value: unknown, field: Field, min = 0) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > MAX_AMOUNT) {
    throw new InputError((t) => t.errors.invalid(t.fields[field]));
  }
  return value;
}

/** An amount that may have paisa, such as one line's share of a courier charge. */
export function requireDecimalAmount(value: unknown, field: Field) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) {
    throw new InputError((t) => t.errors.invalid(t.fields[field]));
  }
  return Math.round(value * 10_000) / 10_000;
}

export function requireSize(value: unknown) {
  if (!SIZES.includes(value as (typeof SIZES)[number])) {
    throw new InputError((t) => t.errors.invalidSize);
  }
  return value as string;
}

export function requireLines<T>(value: unknown, parse: (line: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InputError((t) => t.errors.noItems);
  }
  return value.map((line) => parse(line as Record<string, unknown>));
}
