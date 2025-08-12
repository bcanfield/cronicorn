import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authLogger from "./auth-logger";

// Mock the pino logger from the module
vi.mock("./auth-logger", async () => {
  const actual = await vi.importActual<typeof authLogger>("./auth-logger");
  return {
    ...actual,
    authLogger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    logAuthDebug: vi.fn(),
    logAuthInfo: vi.fn(),
    logAuthWarn: vi.fn(),
    logAuthError: vi.fn(),
  };
});

describe("auth-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call debug logger with path and message", () => {
    authLogger.logAuthDebug("/api/test", "Debug message");
    expect(authLogger.logAuthDebug).toHaveBeenCalledWith("/api/test", "Debug message");
  });

  it("should call info logger with path and message", () => {
    authLogger.logAuthInfo("/api/test", "Info message");
    expect(authLogger.logAuthInfo).toHaveBeenCalledWith("/api/test", "Info message");
  });

  it("should call warn logger with path and message", () => {
    authLogger.logAuthWarn("/api/test", "Warning message");
    expect(authLogger.logAuthWarn).toHaveBeenCalledWith("/api/test", "Warning message");
  });

  it("should call error logger with path, message and error", () => {
    const error = new Error("Test error");
    authLogger.logAuthError("/api/test", "Error message", error);
    expect(authLogger.logAuthError).toHaveBeenCalledWith("/api/test", "Error message", error);
  });

  it("should call debug logger with metadata when provided", () => {
    const metadata = { userId: "123", action: "test" };
    authLogger.logAuthDebug("/api/test", "Debug with metadata", metadata);
    expect(authLogger.logAuthDebug).toHaveBeenCalledWith("/api/test", "Debug with metadata", metadata);
  });
});
