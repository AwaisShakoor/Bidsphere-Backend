import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { NextFunction, Request, Response } from "express";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "requests.log");

const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "oldpassword",
  "currentpassword",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "otp",
  "code",
  "secret",
  "apikey",
  "api_key",
  "cardnumber",
  "cvv",
  "cvc",
]);

const SKIP_PATH_PREFIXES = ["/api-docs"];

/** Top-level keys safe/useful to show briefly in the terminal. */
const TERMINAL_RESPONSE_KEYS = new Set([
  "message",
  "success",
  "url",
  "error",
]);

function colorForStatus(status: number): string {
  if (status >= 500) return RED;
  if (status >= 400) return YELLOW;
  if (status >= 200 && status < 300) return GREEN;
  return CYAN;
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[Truncated]";
  if (value == null) return value;
  if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bytes]`;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = sanitize(nested, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string" && value.length > 200) {
    return `${value.slice(0, 200)}…[truncated]`;
  }
  return value;
}

/** Compact shape for terminal — never dumps big payment/user payloads. */
function summarizeForTerminal(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value !== "object") {
    if (typeof value === "string" && value.length > 120) {
      return `${value.slice(0, 120)}…`;
    }
    return value;
  }

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (TERMINAL_RESPONSE_KEYS.has(key)) {
      out[key] = summarizeForTerminal(nested);
      continue;
    }
    if (Array.isArray(nested)) {
      out[key] = `[${nested.length} items]`;
      continue;
    }
    if (nested && typeof nested === "object") {
      out[key] = `{${Object.keys(nested as object).length} fields}`;
      continue;
    }
    out[key] = nested;
  }

  return out;
}

function extractMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  if (
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  return "";
}

function shouldSkip(url: string): boolean {
  return SKIP_PATH_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value !== "object") return true;
  if (Buffer.isBuffer(value)) return value.length > 0;
  return Object.keys(value as object).length > 0;
}

async function appendHistory(entry: Record<string, unknown>): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.error("Failed to write request history log:", error);
  }
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (shouldSkip(req.originalUrl)) {
    next();
    return;
  }

  const start = Date.now();
  let responseBody: unknown;

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as Response["json"];

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;
    const color = colorForStatus(status);
    const timestamp = new Date().toISOString();
    const message = extractMessage(responseBody);
    const userId = req.user?.userId;
    const bodySummary = hasContent(req.body)
      ? summarizeForTerminal(sanitize(req.body))
      : undefined;
    const responseSummary =
      responseBody !== undefined
        ? summarizeForTerminal(sanitize(responseBody))
        : undefined;

    const entry = {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      status,
      durationMs,
      message: message || undefined,
      userId: userId || undefined,
      ip: req.ip,
      query: hasContent(req.query) ? sanitize(req.query) : undefined,
      params: hasContent(req.params) ? sanitize(req.params) : undefined,
      body: bodySummary,
      // File keeps a summary too — full dumps are too noisy for payment lists.
      response: responseSummary,
    };

    const extras = [
      userId ? `user=${userId}` : null,
      message || null,
      bodySummary ? `body=${JSON.stringify(bodySummary)}` : null,
      responseSummary ? `res=${JSON.stringify(responseSummary)}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const line =
      `${DIM}[${timestamp}]${RESET} ` +
      `${color}${req.method.padEnd(6)}${RESET} ${req.originalUrl} ` +
      `${color}→ ${status}${RESET} ` +
      `${DIM}(${durationMs}ms)${RESET}` +
      (extras ? ` ${DIM}${extras}${RESET}` : "");

    if (status >= 500) {
      console.error(line);
    } else {
      console.log(line);
    }

    void appendHistory(entry);
  });

  next();
}
