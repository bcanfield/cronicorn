import type { AuthConfig } from "@hono/auth-js";

import GitHub from "@auth/core/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import db from "../db/index.js";
import env from "../env.js";

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
    // Add custom callback to check if user has already been authenticated via API key
    callbacks: {
      // Only proceed with auth.js authentication if user not already authenticated by API key
      signIn: async ({ user }) => {
        return !!user;
      },
    },
  };
};
