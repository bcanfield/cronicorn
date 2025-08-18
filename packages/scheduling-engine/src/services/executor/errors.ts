// Endpoint execution error classification (scaffold)
import type { EndpointErrorCategory } from "./retry-policy.js";

export type ClassifiedEndpointError = {
  category: EndpointErrorCategory;
  transient: boolean;
  message?: string;
  statusCode?: number;
};

export function classifyEndpointFailure(opts: { error?: unknown; statusCode?: number; aborted?: boolean }): ClassifiedEndpointError {
  if (opts.aborted)
    return { category: "aborted", transient: false, statusCode: opts.statusCode, message: "Aborted" };
  const { statusCode } = opts;
  if (typeof statusCode === "number") {
    if (statusCode >= 500)
      return { category: "http_5xx", transient: true, statusCode };
    if (statusCode >= 400)
      return { category: "http_4xx", transient: false, statusCode };
  }
  const msg = opts.error instanceof Error ? opts.error.message : typeof opts.error === "string" ? opts.error : undefined;
  if (msg) {
    if (/timeout|ETIMEDOUT|AbortError/i.test(msg))
      return { category: "timeout", transient: true, message: msg };
    if (/network|ENOTFOUND|ECONNRESET|ECONNREFUSED|EHOSTUNREACH/i.test(msg))
      return { category: "network", transient: true, message: msg };
  }
  return { category: "unknown", transient: false, statusCode, message: msg };
}
