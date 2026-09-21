import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import checkoutHandler from "../api/checkout.js";
import checkoutSessionHandler from "../api/checkout-session.js";
import eventsHandler from "../api/events.js";
import stripeWebhookHandler from "../api/stripe-webhook.js";
import { getPool } from "../api/_db.js";
import { reconcileReservations, reconciliationErrorDetails, TICKET_HOLD_MINUTES } from "../api/_inventory.js";

const requiredVariables = ["SITE_URL", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "DATABASE_URL"];
for (const name of requiredVariables) {
  if (!process.env[name]?.trim()) throw new Error(`Missing required environment variable: ${name}`);
}

const port = Number(process.env.PORT || "3000");
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");

// Resolve against this module so npm start works regardless of the working directory.
const staticRoot = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), "../../dist"));
const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
};

const handlers: Record<string, (request: IncomingMessage, response: ServerResponse) => Promise<void>> = {
  "/api/events": eventsHandler,
  "/api/checkout": checkoutHandler,
  "/api/checkout-session": checkoutSessionHandler,
  "/api/stripe-webhook": stripeWebhookHandler,
};

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  }).end(JSON.stringify(body));
}

async function findStaticFile(pathname: string) {
  try {
    const filename = await realpath(resolve(staticRoot, `.${pathname}`));
    const localPath = relative(staticRoot, filename);
    // Checking the resolved path also rejects symlinks leading outside the build directory.
    if (!localPath || localPath === ".." || localPath.startsWith(`..${sep}`) || isAbsolute(localPath)) return null;
    const details = await stat(filename);
    return details.isFile() ? { filename, size: details.size } : null;
  } catch (error) {
    if (error instanceof Error && "code" in error && ["ENOENT", "ENOTDIR"].includes(String(error.code))) return null;
    throw error;
  }
}

async function serveStatic(request: IncomingMessage, response: ServerResponse, pathname: string) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    json(response, 405, { error: "Method not allowed." });
    return;
  }

  if (pathname.includes("\0") || pathname.includes("\\") || pathname.split("/").some((segment) => segment.startsWith("."))) {
    json(response, 404, { error: "Not found." });
    return;
  }

  let file = await findStaticFile(pathname === "/" ? "/index.html" : pathname);
  if (!file && request.method === "GET" && !extname(pathname) && request.headers.accept?.includes("text/html")) {
    file = await findStaticFile("/index.html");
  }
  if (!file) {
    json(response, 404, { error: "Not found." });
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(file.filename)] || "application/octet-stream",
    "Content-Length": file.size,
    "Cache-Control": relative(staticRoot, file.filename).startsWith(`assets${sep}`)
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  await pipeline(createReadStream(file.filename), response);
}

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  try {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
    } catch {
      json(response, 400, { error: "Invalid request URL." });
      return;
    }

    if (pathname === "/api/health") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.setHeader("Allow", "GET, HEAD");
        json(response, 405, { error: "Method not allowed." });
        return;
      }
      try {
        await getPool().query("SELECT 1");
        json(response, 200, { status: "ok" });
      } catch {
        json(response, 503, { status: "unavailable" });
      }
      return;
    }
    if (Object.hasOwn(handlers, pathname)) {
      // Keep the original request stream intact for Stripe signature verification.
      await handlers[pathname](request, response);
      return;
    }
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      json(response, 404, { error: "Not found." });
      return;
    }
    await serveStatic(request, response, pathname);
  } catch {
    if (response.destroyed) return;
    console.error("Unable to complete HTTP request.");
    if (response.headersSent) response.destroy();
    else json(response, 500, { error: "Request could not be completed." });
  }
});

server.requestTimeout = 60_000;
server.headersTimeout = 30_000;

let reconciliation: Promise<void> | undefined;
let stopping = false;
function reconcile() {
  if (stopping || reconciliation) return;
  reconciliation = reconcileReservations()
    .then((summary) => {
      if (summary.expired || summary.paid || summary.failed) console.log("Ticket reservation reconciliation:", summary);
    })
    .catch((error) => console.error("Ticket reservation reconciliation failed; it will retry.", reconciliationErrorDetails(error)))
    .finally(() => { reconciliation = undefined; });
}

const reconciliationTimer = setInterval(reconcile, 60_000);
reconciliationTimer.unref();

async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(reconciliationTimer);
  const deadline = setTimeout(() => {
    server.closeAllConnections();
    console.error("Server shutdown exceeded its deadline.");
    process.exit(1);
  }, 30_000);
  deadline.unref();
  try {
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => error ? rejectClose(error) : resolveClose());
    });
    await reconciliation;
    await getPool().end();
    clearTimeout(deadline);
  } catch {
    console.error("Server shutdown failed.");
    process.exitCode = 1;
  }
}

process.on("SIGTERM", () => { void shutdown(); });
process.on("SIGINT", () => { void shutdown(); });
server.on("error", () => {
  console.error("Unable to start the HTTP server.");
  process.exit(1);
});
server.listen(port, "0.0.0.0", () => {
  console.log(`Bella Vita is listening on port ${port}.`);
  console.log(`Ticket holds expire after ${TICKET_HOLD_MINUTES} minutes; reconciliation runs every minute.`);
  reconcile();
});
