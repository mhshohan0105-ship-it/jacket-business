import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { credentialsMatch, isValidSession, loginConfigured, sessionToken } from "./auth";

describe("auth", () => {
  beforeEach(() => {
    vi.stubEnv("APP_USERNAME", "owner");
    vi.stubEnv("APP_PASSWORD", "correct-horse");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("needs both the right username and password", () => {
    expect(credentialsMatch("owner", "correct-horse")).toBe(true);
    expect(credentialsMatch(" owner ", "correct-horse")).toBe(true);
    expect(credentialsMatch("owner", "wrong")).toBe(false);
    expect(credentialsMatch("other", "correct-horse")).toBe(false);
    expect(credentialsMatch(null, null)).toBe(false);
  });

  it("lets nobody in when login is not configured", () => {
    vi.stubEnv("APP_PASSWORD", "");
    expect(loginConfigured()).toBe(false);
    expect(credentialsMatch("owner", "")).toBe(false);
    expect(sessionToken()).toBeNull();
    expect(isValidSession("anything")).toBe(false);
  });

  it("accepts only the current session value", () => {
    const token = sessionToken() ?? "";
    expect(isValidSession(token)).toBe(true);
    expect(isValidSession("forged")).toBe(false);
    expect(isValidSession(undefined)).toBe(false);
  });

  it("ends old sessions when the password changes", () => {
    const token = sessionToken() ?? "";
    vi.stubEnv("APP_PASSWORD", "new-password");
    expect(isValidSession(token)).toBe(false);
  });
});
