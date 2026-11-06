import { describe, expect, it } from "vitest";
import { assertOwnDatabase, checkDatabaseEnv, databaseName, isPooledUrl } from "./guard";

// Made-up values: this host cannot exist.
const SECRET = "fake-pass";
const HOST = "example.invalid";
const pooled = (db: string) => `postgresql://owner:${SECRET}@ep-abc-pooler.${HOST}/${db}?sslmode=require`;
const direct = (db: string) => `postgresql://owner:${SECRET}@ep-abc.${HOST}/${db}?sslmode=require`;

describe("databaseName", () => {
  it("reads the name, ignoring the query string", () => {
    expect(databaseName(pooled("jacket_business"))).toBe("jacket_business");
  });

  it("handles missing or broken values", () => {
    expect(databaseName("postgresql://owner:x@host/")).toBeNull();
    expect(databaseName("not a url")).toBeNull();
  });
});

describe("isPooledUrl", () => {
  it("tells pooled from direct by the endpoint", () => {
    expect(isPooledUrl(pooled("x"))).toBe(true);
    expect(isPooledUrl(direct("x"))).toBe(false);
  });
});

describe("assertOwnDatabase", () => {
  it("allows only jacket_business", () => {
    expect(() => assertOwnDatabase(pooled("jacket_business"), "DATABASE_URL")).not.toThrow();
    expect(() => assertOwnDatabase(pooled("testvault"), "DATABASE_URL")).toThrow(/Refusing/);
    expect(() => assertOwnDatabase(pooled("neondb"), "DATABASE_URL")).toThrow(/Refusing/);
  });

  it("never puts the password in the error", () => {
    expect(() => assertOwnDatabase(pooled("testvault"), "DATABASE_URL")).toThrow(
      expect.not.objectContaining({ message: expect.stringContaining(SECRET) }),
    );
  });
});

describe("checkDatabaseEnv", () => {
  const good = {
    DATABASE_URL: pooled("jacket_business"),
    DATABASE_URL_UNPOOLED: direct("jacket_business"),
  };

  it("passes the correct pair", () => {
    expect(checkDatabaseEnv(good).problems).toEqual([]);
  });

  it("rejects another database on either URL", () => {
    expect(checkDatabaseEnv({ ...good, DATABASE_URL: pooled("testvault") }).problems).toHaveLength(1);
    expect(
      checkDatabaseEnv({ ...good, DATABASE_URL_UNPOOLED: direct("testvault") }).problems,
    ).toHaveLength(1);
  });

  it("rejects swapped or missing URLs", () => {
    const swapped = { DATABASE_URL: good.DATABASE_URL_UNPOOLED, DATABASE_URL_UNPOOLED: good.DATABASE_URL };
    expect(checkDatabaseEnv(swapped).problems).toHaveLength(2);
    expect(checkDatabaseEnv({}).problems).toHaveLength(2);
  });

  it("reports names without hosts or passwords", () => {
    const text = checkDatabaseEnv(good).report.join("\n");
    expect(text).toContain("database=jacket_business, pooled");
    expect(text).toContain("database=jacket_business, direct");
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain(HOST);
  });
});
