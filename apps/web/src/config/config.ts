// eslint-disable-next-line node/no-process-env
export const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:9999/api" : "https://api.cronicorn.com/api";
export const DOCS_URL = `${API_URL}/reference`;
export const GITHUB_URL = "https://github.com/bcanfield/cronicorn";
