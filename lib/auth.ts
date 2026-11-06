import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "jacket_session";

function sameText(a: string, b: string) {
  // Hashing first gives equal lengths, which timingSafeEqual requires.
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(a), hash(b));
}

function credentials() {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  return username && password ? { username, password } : null;
}

export function loginConfigured() {
  return credentials() !== null;
}

export function credentialsMatch(username: unknown, password: unknown) {
  const expected = credentials();
  if (!expected || typeof username !== "string" || typeof password !== "string") return false;
  // Check both so a wrong username takes as long as a wrong password.
  const userOk = sameText(username.trim(), expected.username);
  const passOk = sameText(password, expected.password);
  return userOk && passOk;
}

/** Session value. Changing the username or password logs everyone out. */
export function sessionToken() {
  const expected = credentials();
  if (!expected) return null;
  return createHmac("sha256", expected.password)
    .update(`jacket-business:${expected.username}`)
    .digest("hex");
}

export function isValidSession(value: string | undefined) {
  const token = sessionToken();
  return Boolean(token && value && sameText(value, token));
}
