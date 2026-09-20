import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import EmbeddedPostgres from "embedded-postgres";

// Local stock must never authorize real sales independently of the production DB.
if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || "")) {
  throw new Error("Local inventory requires a Stripe TEST key in .env.local and test Price IDs in INVENTORY_CONFIG_PATH. npm run dev can preview live events without local checkout.");
}
const directory = resolve(".local-inventory");
await mkdir(directory, { recursive: true, mode: 0o700 });
const passwordPath = resolve(directory, "password");
let password;
try { password = await readFile(passwordPath, "utf8"); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  password = randomBytes(24).toString("hex");
  await writeFile(passwordPath, password, { mode: 0o600, flag: "wx" });
}
const port = Number(process.env.LOCAL_DATABASE_PORT || "55432");
const database = new EmbeddedPostgres({
  databaseDir: resolve(directory, "data"), port, user: "postgres", password,
  persistent: true, postgresFlags: ["-h", "127.0.0.1", "-k", directory],
  onLog: () => {}, onError: () => console.error("Local PostgreSQL reported an error."),
});
const env = {
  ...process.env,
  DATABASE_URL: `postgresql://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/postgres`,
  SITE_URL: "http://localhost:5173",
};
let child;
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  child?.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
async function run(args) {
  if (stopping) return 1;
  child = spawn(process.execPath, args, { env, stdio: "inherit" });
  return await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => { child = undefined; resolveExit(code ?? 0); });
  });
}
let started = false;
try {
  let initialized = false;
  try { await access(resolve(directory, "data/PG_VERSION")); initialized = true; } catch { /* first run */ }
  if (!initialized) await database.initialise();
  await database.start();
  started = true;
  const setupCode = await run(["dist-server/scripts/setup-inventory.js"]);
  if (setupCode !== 0) process.exitCode = setupCode;
  else {
    console.log("Local test inventory is ready. Starting Vite at http://localhost:5173.");
    process.exitCode = await run(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5173", "--strictPort"]);
  }
} finally {
  if (started) await database.stop();
}
