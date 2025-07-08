// Check if we're in development mode and auth is disabled
export const isAuthDisabled = process.env.NODE_ENV === "development" && process.env.ENABLE_DEV_AUTH !== "true";
if (isAuthDisabled) {
	console.warn("Authentication is disabled in development mode. Using mock user.");
}
