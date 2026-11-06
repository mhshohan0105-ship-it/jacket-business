// This app must only ever talk to its own database. Another live app shares the
// same Neon project, so a copied URL could otherwise point at that app's data.
// Nothing here may print a whole URL: it contains the password.

export const EXPECTED_DATABASE = "jacket_business";

export function databaseName(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.slice(1)) || null;
  } catch {
    return null;
  }
}

/** Neon marks a pooled connection with "-pooler" on the endpoint in the hostname. */
export function isPooledUrl(url: string) {
  try {
    return new URL(url).hostname.split(".")[0].endsWith("-pooler");
  } catch {
    return false;
  }
}

export function assertOwnDatabase(url: string, variable: string) {
  const name = databaseName(url);
  if (name !== EXPECTED_DATABASE) {
    throw new Error(
      `${variable} points to database "${name ?? "unknown"}", expected "${EXPECTED_DATABASE}". Refusing to connect.`,
    );
  }
}

type Env = Record<string, string | undefined>;

function describe(url: string | undefined) {
  if (!url) return "not set";
  return `database=${databaseName(url) ?? "unknown"}, ${isPooledUrl(url) ? "pooled" : "direct"}`;
}

/** Checks both URLs without connecting. Output is safe to show: no host, no password. */
export function checkDatabaseEnv(env: Env) {
  const pooled = env.DATABASE_URL;
  const direct = env.DATABASE_URL_UNPOOLED;
  const problems: string[] = [];

  for (const [variable, url] of [
    ["DATABASE_URL", pooled],
    ["DATABASE_URL_UNPOOLED", direct],
  ] as const) {
    if (!url) problems.push(`${variable} is not set`);
    else if (databaseName(url) !== EXPECTED_DATABASE) {
      problems.push(`${variable} is not the ${EXPECTED_DATABASE} database`);
    }
  }
  if (pooled && !isPooledUrl(pooled)) problems.push("DATABASE_URL must be the pooled URL");
  if (direct && isPooledUrl(direct)) problems.push("DATABASE_URL_UNPOOLED must be the direct URL");

  return {
    report: [`DATABASE_URL: ${describe(pooled)}`, `DATABASE_URL_UNPOOLED: ${describe(direct)}`],
    problems,
  };
}
