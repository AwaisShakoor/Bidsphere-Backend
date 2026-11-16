import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { NextFunction, Request, Response } from "express";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "requests.log");
const SKIP_PATH_PREFIXES = ["/api-docs"];

function colorForStatus(status: number): string {
  if (status >= 500) return RED;
  if (status >= 400) return YELLOW;
  if (status >= 200 && status < 300) return GREEN;
  return DIM;
}

function extractErrorMessage(body: unknown): string {
  if (typeof body === "string" && body.trim()) return body.trim();
  if (!body || typeof body !== "object") return "";

  const obj = body as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message.trim()) {
    return obj.message.trim();
  }
  if (typeof obj.error === "string" && obj.error.trim()) {
    return obj.error.trim();
  }
  return "";
}

function shouldSkip(url: string): boolean {
  return SKIP_PATH_PREFIXES.some((prefix) => url.startsWith(prefix));
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

  const originalSend = res.send.bind(res);
  res.send = ((body: unknown) => {
    if (responseBody === undefined) {
      responseBody = body;
    }
    return originalSend(body);
  }) as Response["send"];

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;
    const color = colorForStatus(status);
    const timestamp = new Date().toISOString();
    const code =
      responseBody &&
      typeof responseBody === "object" &&
      typeof (responseBody as { code?: unknown }).code === "string"
        ? (responseBody as { code: string }).code
        : undefined;

    let message = extractErrorMessage(responseBody);
    if (!message && status >= 400) {
      message =
        status === 404
          ? `Cannot ${req.method} ${req.originalUrl}`
          : `Request failed with status ${status}`;
    }

    const entry = {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      status,
      durationMs,
      message: message || undefined,
      code,
      userId: req.user?.userId,
    };

    if (status >= 400) {
      const errorLine =
        `${BOLD}${color}ERROR${RESET} ` +
        `${DIM}[${timestamp}]${RESET} ` +
        `${color}${req.method}${RESET} ${req.originalUrl} ` +
        `${color}→ ${status}${RESET} ` +
        `${DIM}(${durationMs}ms)${RESET}` +
        (code ? ` ${DIM}code=${code}${RESET}` : "") +
        (req.user?.userId ? ` ${DIM}user=${req.user.userId}${RESET}` : "") +
        `\n  ${color}↳ ${message || `HTTP ${status}`}${RESET}`;

      if (status >= 500) console.error(errorLine);
      else console.log(errorLine);
    } else {
      const successMsg = extractErrorMessage(responseBody);
      const line =
        `${DIM}[${timestamp}]${RESET} ` +
        `${color}${req.method.padEnd(6)}${RESET} ${req.originalUrl} ` +
        `${color}→ ${status}${RESET} ` +
        `${DIM}(${durationMs}ms)${RESET}` +
        (successMsg ? ` ${DIM}${successMsg}${RESET}` : "");
      console.log(line);
    }

    void appendHistory(entry);
  });

  next();
}
