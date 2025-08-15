import pino from "pino";

import env from "@/api/env.js";

// Create a configurable logger for auth debugging
export const authLogger = pino({
  name: "auth",
  level: env.LOG_LEVEL || "info",
  transport: env.NODE_ENV === "production"
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
});

// Helper functions to standardize log formats
export function logAuthInfo(path: string, message: string, data?: Record<string, unknown>) {
  authLogger.info({ path, ...data }, message);
}

export function logAuthDebug(path: string, message: string, data?: Record<string, unknown>) {
  authLogger.debug({ path, ...data }, message);
}

export function logAuthWarn(path: string, message: string, data?: Record<string, unknown>) {
  authLogger.warn({ path, ...data }, message);
}

export function logAuthError(path: string, message: string, error?: Error, data?: Record<string, unknown>) {
  authLogger.error({
    path,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
    ...data,
  }, message);
}
