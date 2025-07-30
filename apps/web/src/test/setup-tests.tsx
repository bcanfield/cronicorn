import app from "@tasks-app/api/app";
import "@testing-library/jest-dom";

// expand(config({
//   path: path.resolve(
//     process.cwd(),
//     process.env.NODE_ENV === "test" ? ".env.test" : ".env",
//   ),
// }));
// Create a test client instance
// const client = testClient();
globalThis.fetch = (url, init) => app.request(url as string, init);
