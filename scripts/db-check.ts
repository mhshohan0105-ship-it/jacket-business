// Shows which database the URLs in .env point to. Does not connect to anything.
import { checkDatabaseEnv } from "../lib/db/guard";

const { report, problems } = checkDatabaseEnv(process.env);
console.log(report.join("\n"));

if (problems.length > 0) {
  console.error(`\nNot ready:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("\nOK");
