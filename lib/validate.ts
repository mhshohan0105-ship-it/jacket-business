import { SIZES } from "./constants";

export class InputError extends Error {}

export function requireText(value: unknown, label: string) {
  const text = optionalText(value);
  if (!text) throw new InputError(`${label} লিখুন`);
  return text;
}

export function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function requireDate(value: unknown, label: string) {
  const date = optionalDate(value);
  if (!date) throw new InputError(`${label} দিন`);
  return date;
}

export function optionalDate(value: unknown) {
  if (typeof value !== "string" || value === "") return null;
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  if (!valid) throw new InputError("তারিখ ঠিক নেই");
  return value;
}

// Keeps values well inside Postgres' 32-bit integer columns.
const MAX_AMOUNT = 100_000_000;

export function requireAmount(value: unknown, label: string, min = 0) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > MAX_AMOUNT) {
    throw new InputError(`${label} ঠিক নেই`);
  }
  return value;
}

/** An amount that may have paisa, such as one line's share of a courier charge. */
export function requireDecimalAmount(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) {
    throw new InputError(`${label} ঠিক নেই`);
  }
  return Math.round(value * 10_000) / 10_000;
}

export function requireSize(value: unknown) {
  if (!SIZES.includes(value as (typeof SIZES)[number])) throw new InputError("সাইজ ঠিক নেই");
  return value as string;
}

export function requireLines<T>(value: unknown, parse: (line: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InputError("অন্তত একটা আইটেম যোগ করুন");
  }
  return value.map((line) => parse(line as Record<string, unknown>));
}
