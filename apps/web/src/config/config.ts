// eslint-disable-next-line node/no-process-env
export const API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:9999/api" // Development API URL
  : "https://api.cronicorn.com/api"; // Production API URL using the dedicated API domain
export const DOCS_URL = `${API_URL}/reference`;
export const GITHUB_URL = "https://github.com/bcanfield/cronicorn";

export const APP_NAME = "Cronicorn";
export const APP_DESCRIPTION_1 = "Scheduling that adapts to your world";
export const APP_DESCRIPTION_2 = "Describe what should run and when — Cronicorn handles the timing - giving you more time to build.";
