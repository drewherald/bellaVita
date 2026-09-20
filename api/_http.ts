import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function readRawBody(request: IncomingMessage, limit = 64 * 1024): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > limit) throw new HttpError(413, "Request is too large.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

export function siteUrl(): string {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("SITE_URL is not configured");
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("SITE_URL must be an HTTP(S) origin");
  }
  return url.origin;
}
