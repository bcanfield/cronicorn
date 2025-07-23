import type { AuthConfig } from "@hono/auth-js";

import GitHub from "@auth/core/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import db from "../db";
import env from "../env";

export default function createAuthConfig(): AuthConfig {
  return {
    adapter: DrizzleAdapter(db),
    secret: env.AUTH_SECRET,
    providers: [
      GitHub({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      }),
    ],
  };
};
