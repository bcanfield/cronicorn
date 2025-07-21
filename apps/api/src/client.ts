import { hc } from "hono/client";

import type { AppType } from "./app";

export function createClient(baseUrl: string) {
  return hc<AppType>(baseUrl);
}
