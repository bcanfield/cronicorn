import type { AuthConfig } from "@hono/auth-js";

import GitHub from "@auth/core/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import db from "../db";
import env from "../env";

export default function createAuthConfig(): AuthConfig {
    // log vars
    console.log("AUTH_SECRET:", env.AUTH_SECRET);
    console.log("GITHUB_CLIENT_ID:", env.GITHUB_CLIENT_ID);
    console.log("GITHUB_CLIENT_SECRET:", env.GITHUB_CLIENT_SECRET);
    // eslint-disable-next-line node/no-process-env
    console.log("AUTH_URL:", process.env.AUTH_URL);

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
