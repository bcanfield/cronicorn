/**
 *  Helper to bake in the API_URL during build time, which can be used in the frontend during runtime.
 */
export const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "NEXT_PUBLIC_API_URL is not set. Defaulting to http://localhost:3001 for development."
      );
      return "http://localhost:3001"; // Default for development
    }
    throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
  }
  return apiUrl;
};
