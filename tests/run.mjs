import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const runTests = async (databaseUrl) => {
  const testDirectory = resolve("dist-server/tests");
  const files = (await readdir(testDirectory))
    .filter((filename) => filename.endsWith(".test.js"))
    .map((filename) => join(testDirectory, filename));
  if (!files.length) throw new Error("Compile the integration tests before running this script.");
  return new Promise((resolveExitCode, reject) => {
    const child = spawn(process.execPath, ["--test", "--test-concurrency=1", ...files], {
      stdio: "inherit",
      env: { ...process.env, TEST_DATABASE_URL: databaseUrl },
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Test process stopped with ${signal}`));
      else resolveExitCode(code ?? 1);
    });
  });
};

const findAvailablePort = () => new Promise((resolvePort, reject) => {
  const listener = createServer();
  listener.once("error", reject);
  listener.listen(0, "127.0.0.1", () => {
    const address = listener.address();
    listener.close((error) => {
      if (error) reject(error);
      else if (!address || typeof address === "string") reject(new Error("Could not choose a PostgreSQL test port"));
      else resolvePort(address.port);
    });
  });
});

if (process.env.TEST_DATABASE_URL) {
  process.exitCode = await runTests(process.env.TEST_DATABASE_URL);
} else {
  if (process.getuid?.() === 0) {
    throw new Error("Run tests as a non-root user or set TEST_DATABASE_URL to a disposable PostgreSQL database.");
  }
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const port = await findAvailablePort();
  const directory = await mkdtemp(join(tmpdir(), "bella-vita-inventory-test-"));
  const password = randomBytes(24).toString("hex");
  const startupLog = [];
  const database = new EmbeddedPostgres({
    databaseDir: join(directory, "data"),
    port,
    user: "postgres",
    password,
    persistent: false,
    postgresFlags: ["-h", "127.0.0.1", "-k", directory],
    onLog: (message) => { startupLog.push(String(message)); },
    onError: (error) => { startupLog.push(String(error)); },
  });
  let started = false;
  try {
    await database.initialise();
    await database.start();
    started = true;
    console.log("Running inventory integration tests against temporary PostgreSQL.");
    process.exitCode = await runTests(`postgresql://postgres:${password}@127.0.0.1:${port}/postgres`);
  } catch (error) {
    if (!started) console.error(startupLog.join(""));
    throw error;
  } finally {
    if (started) await database.stop();
    await rm(directory, { recursive: true, force: true });
  }
}
