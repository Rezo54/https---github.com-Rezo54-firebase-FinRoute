// src/lib/logger.ts
export function logInfo(msg: string, ...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[INFO] ${msg}`, ...args);
  }
}

export function logError(msg: string, err?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${msg}`, err);
  }
}
