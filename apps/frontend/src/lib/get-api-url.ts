import "server-only";

/**
 *  Helper to bake in the API_URL during build time, which can be used in the frontend during runtime.
 */
export const getApiUrl = () => {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "API_URL is not set. Defaulting to http://localhost:3001 for development."
      );
      return "http://localhost:3001"; // Default for development
    }
    throw new Error("API_URL environment variable is not set");
  }
  return apiUrl;
};
